const ConversationTranscript = require('../models/ConversationTranscript');
const Appointment = require('../models/Appointment');
const { generateMedicalText } = require('../services/gemini.service');

async function createConversationInsight(req, res, next) {
  try {
    const { appointment, patient, transcript, language } = req.body;
    let patientId = patient;
    if (appointment) {
      const appt = await Appointment.findById(appointment);
      if (appt) patientId = appt.patient;
    }
    if (!patientId || !transcript) {
      const error = new Error('Patient and transcript are required');
      error.status = 400;
      throw error;
    }
    const aiInsights = await generateMedicalText({
      feature: 'doctor-patient-conversation-insights',
      role: req.user.role,
      language: language || req.user.language,
      input: {
        instruction: 'Summarize the clinical conversation, list patient concerns, doctor advice, medication adherence risks, follow-up needs, and documentation suggestions. Do not invent facts.',
        transcript
      }
    });
    const saved = await ConversationTranscript.create({
      appointment,
      doctor: req.user._id,
      patient: patientId,
      transcript,
      language,
      aiInsights
    });
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
}

async function listConversationInsights(req, res, next) {
  try {
    const query = req.user.role === 'doctor' ? { doctor: req.user._id } : { patient: req.user._id };
    res.json(await ConversationTranscript.find(query).populate(['doctor', 'patient', 'appointment']).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

module.exports = { createConversationInsight, listConversationInsights };
