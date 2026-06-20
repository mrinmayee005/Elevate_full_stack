const { generateMedicalText, analyzeMedicalImage } = require('../services/gemini.service');
const { uploadBuffer } = require('../services/cloudinary.service');
const AIInsight = require('../models/AIInsight');
const MedicineScan = require('../models/MedicineScan');

const allowedFeatures = new Set([
  'clinical-copilot', 'prescription-generator', 'drug-interaction-checker', 'suggested-tests',
  'follow-up-planner', 'risk-detection', 'patient-summary', 'shift-handover',
  'alert-prioritization', 'daily-work-summary', 'patient-risk-summary', 'health-assistant',
  'report-simplifier', 'prescription-simplifier', 'health-insights', 'translate-ui'
]);

async function textAI(req, res, next) {
  try {
    const { feature, input, language, patient } = req.body;
    if (!allowedFeatures.has(feature)) {
      const error = new Error('Unsupported AI feature');
      error.status = 400;
      throw error;
    }
    const response = await generateMedicalText({ feature, role: req.user.role, language, input });
    const insight = await AIInsight.create({ user: req.user._id, patient, feature, prompt: JSON.stringify(input), response, language });
    res.json({ response, insightId: insight._id });
  } catch (error) {
    next(error);
  }
}

async function medicineScan(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error('Medicine image is required');
      error.status = 400;
      throw error;
    }
    const { language, context } = req.body;
    const response = await analyzeMedicalImage({ feature: 'medicine-scanner', language, file: req.file, context });
    const image = await uploadBuffer(req.file, 'hospital-2050/medicine-scans');
    const scan = await MedicineScan.create({ patient: req.user._id, image, language, aiResult: response });
    res.json({ response, scan });
  } catch (error) {
    next(error);
  }
}

module.exports = { textAI, medicineScan };
