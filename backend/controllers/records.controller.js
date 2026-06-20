const MedicalReport = require('../models/MedicalReport');
const Prescription = require('../models/Prescription');
const Reminder = require('../models/Reminder');
const { uploadBuffer } = require('../services/cloudinary.service');
const { notifyUser } = require('../services/notification.service');
const { generateMedicalText, analyzeMedicalImage } = require('../services/gemini.service');

async function createReport(req, res, next) {
  try {
    const files = [];
    for (const file of req.files || []) files.push(await uploadBuffer(file, 'hospital-2050/reports'));
    const report = await MedicalReport.create({ ...req.body, doctor: req.user._id, files });
    await notifyUser(report.patient, {
      type: 'medical-report',
      title: 'New medical report',
      message: `Dr. ${req.user.name} added a medical report: ${report.title}`,
      severity: 'Info'
    });
    res.status(201).json(await report.populate(['patient', 'doctor']));
  } catch (error) {
    next(error);
  }
}

async function listReports(req, res, next) {
  try {
    const query = req.user.role === 'patient' ? { patient: req.user._id } : req.query.patient ? { patient: req.query.patient } : {};
    res.json(await MedicalReport.find(query).populate(['patient', 'doctor']).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

async function createPrescription(req, res, next) {
  try {
    const prescription = await Prescription.create({ ...req.body, doctor: req.user._id, hospitalName: req.body.hospitalName || 'LifeCare Hospital' });
    const reminders = [];
    for (const med of prescription.medicines || []) {
      reminders.push(await Reminder.create({
        patient: prescription.patient,
        prescription: prescription._id,
        medicineName: med.name,
        schedule: [med.timing, med.frequency].filter(Boolean),
        quantityTotal: Number(med.quantityTotal || med.doseCount || 0),
        quantityLeft: Number(med.quantityTotal || med.doseCount || 0),
        instructions: med.instructions
      }));
    }
    await notifyUser(prescription.patient, {
      type: 'prescription',
      title: 'New prescription',
      message: `Dr. ${req.user.name} sent a prescription with ${prescription.medicines.length} medicine(s).`,
      severity: 'Info'
    });
    res.status(201).json({ prescription: await prescription.populate(['patient', 'doctor']), reminders });
  } catch (error) {
    next(error);
  }
}

async function listPrescriptions(req, res, next) {
  try {
    const query = req.user.role === 'patient' ? { patient: req.user._id } : req.query.patient ? { patient: req.query.patient } : {};
    res.json(await Prescription.find(query).populate(['patient', 'doctor']).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

async function downloadPrescription(req, res, next) {
  try {
    const prescription = await Prescription.findById(req.params.id).populate(['patient', 'doctor']);
    if (!prescription) {
      const error = new Error('Prescription not found');
      error.status = 404;
      throw error;
    }
    if (req.user.role === 'patient' && String(prescription.patient._id) !== String(req.user._id)) {
      const error = new Error('Forbidden');
      error.status = 403;
      throw error;
    }
    const filename = `Hospital-2050-Prescription-${prescription.patient.name.replace(/[^a-z0-9]/gi, '-')}.html`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(renderPrescriptionHtml(prescription));
  } catch (error) {
    next(error);
  }
}

async function simplifyPrescription(req, res, next) {
  try {
    const prescription = await Prescription.findById(req.params.id).populate(['patient', 'doctor']);
    const response = await generateMedicalText({
      feature: 'prescription-simplifier',
      role: req.user.role,
      language: req.body.language || req.user.language,
      input: prescription
    });
    prescription.aiSimplification = response;
    await prescription.save();
    res.json({ response });
  } catch (error) {
    next(error);
  }
}

async function simplifyReport(req, res, next) {
  try {
    const report = await MedicalReport.findById(req.params.id).populate(['patient', 'doctor']);
    const response = await generateMedicalText({
      feature: 'report-simplifier',
      role: req.user.role,
      language: req.body.language || req.user.language,
      input: report
    });
    report.aiSimplification = response;
    await report.save();
    res.json({ response });
  } catch (error) {
    next(error);
  }
}

async function scanPrescription(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error('Prescription image is required');
      error.status = 400;
      throw error;
    }
    const response = await analyzeMedicalImage({
      feature: 'prescription-scanner-reminder-planner',
      language: req.body.language || req.user.language,
      file: req.file,
      context: 'Read the prescription, explain it, identify medicines, and propose reminder timings.'
    });
    const reminder = await Reminder.create({
      patient: req.user._id,
      medicineName: 'From scanned prescription',
      schedule: ['As identified by AI from scanned prescription'],
      instructions: response
    });
    res.json({ response, reminder });
  } catch (error) {
    next(error);
  }
}

function renderPrescriptionHtml(prescription) {
  const meds = prescription.medicines.map((med, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${med.name || ''}</td>
      <td>${med.dosage || med.doseCount || ''}</td>
      <td>${med.timing || med.frequency || ''}</td>
      <td>${med.duration || ''}</td>
      <td>${med.instructions || ''}</td>
    </tr>`).join('');
  return `<!doctype html>
  <html><head><meta charset="utf-8"><title>Prescription</title>
  <style>body{font-family:Arial,sans-serif;color:#0f172a;padding:28px}.head{border-bottom:3px solid #0891b2;padding-bottom:12px;margin-bottom:18px}h1{margin:0;color:#0891b2}table{width:100%;border-collapse:collapse;margin-top:18px}td,th{border:1px solid #cbd5e1;padding:8px;text-align:left}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sign{margin-top:40px;text-align:right}</style>
  </head><body><div class="head"><h1>${prescription.hospitalName || 'LifeCare Hospital'}</h1><p>Smart Multilingual Hospital Care</p></div>
  <div class="meta"><div><b>Patient:</b> ${prescription.patient.name}</div><div><b>Doctor:</b> ${prescription.doctor.name}</div><div><b>Date:</b> ${new Date(prescription.createdAt).toLocaleString()}</div><div><b>Follow-up:</b> ${prescription.followUpDate || 'Not set'}</div></div>
  <table><thead><tr><th>#</th><th>Medicine</th><th>Dose</th><th>Time/Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>${meds}</tbody></table>
  <p><b>Notes:</b> ${prescription.notes || ''}</p><div class="sign">Doctor Signature<br>${prescription.doctor.name}</div></body></html>`;
}

module.exports = {
  createReport,
  listReports,
  createPrescription,
  listPrescriptions,
  downloadPrescription,
  simplifyPrescription,
  simplifyReport,
  scanPrescription
};
