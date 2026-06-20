const Vital = require('../models/Vital');
const Bed = require('../models/Bed');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const NurseTask = require('../models/NurseTask');
const { emitAll } = require('../socket');

async function createVital(req, res, next) {
  try {
    const vital = await Vital.create({ ...req.body, nurse: req.user._id, riskLevel: req.body.riskLevel || classifyRisk(req.body) });
    emitAll('vital:new', vital);
    res.status(201).json(vital);
  } catch (error) {
    next(error);
  }
}

async function assignedPatients(req, res, next) {
  try {
    const query = { status: 'occupied' };
    if (req.user.department) query.department = req.user.department;
    const beds = await Bed.find(query).populate(['patient', 'assignedDoctor', 'department']).sort('code');
    res.json(beds.filter((bed) => bed.patient).map((bed) => ({
      ...bed.patient.toObject(),
      bed: { code: bed.code, type: bed.type, ward: bed.ward, emergency: bed.emergency, doctor: bed.assignedDoctor?.name }
    })));
  } catch (error) {
    next(error);
  }
}

async function tasks(req, res, next) {
  try {
    const beds = (await Bed.find({ status: 'occupied' }).populate(['patient', 'assignedDoctor', 'department']).sort('code')).filter((bed) => bed.patient);
    const admittedIds = beds.map((bed) => bed.patient?._id).filter(Boolean);
    const vitals = await Vital.find({ patient: { $in: admittedIds } }).populate('patient').sort({ createdAt: -1 }).limit(50);
    const prescriptions = await Prescription.find({ patient: { $in: admittedIds } }).populate('patient').sort({ createdAt: -1 }).limit(50);
    const assignedTasks = await NurseTask.find({ patient: { $in: admittedIds }, status: 'pending' }).populate(['patient', 'doctor', 'bed']).sort({ createdAt: -1 });
    const bedByPatient = new Map(beds.map((bed) => [String(bed.patient?._id), bed]));
    const baseTasks = beds.map((bed) => ({
      type: 'Admission',
      patient: bed.patient,
      title: `${bed.emergency ? 'Emergency check' : 'Admission round'}: ${bed.patient?.name || 'patient'}`,
      priority: bed.emergency ? 'Critical' : 'High',
      detail: `Bed ${bed.code}, ${bed.ward || bed.type}, Doctor ${bed.assignedDoctor?.name || '-'}`
    }));
    const vitalTasks = vitals.map((vital) => {
      const bed = bedByPatient.get(String(vital.patient?._id));
      return {
      type: 'Vitals',
      patient: vital.patient,
      title: `Check ${vital.patient?.name || 'patient'} vitals`,
      priority: vital.riskLevel || classifyRisk(vital),
      detail: `Bed ${bed?.code || '-'}, ${bed?.ward || '-'} | BP ${vital.bloodPressure || '-'}, Pulse ${vital.pulse || '-'}, SpO2 ${vital.oxygenLevel || '-'}`
    };
    });
    const medicationTasks = prescriptions.flatMap((prescription) => (prescription.medicines || []).map((medicine) => ({
      type: 'Medication',
      patient: prescription.patient,
      title: `Give ${medicine.name}`,
      priority: medicine.instructions?.toLowerCase().includes('urgent') ? 'High' : 'Medium',
      detail: `Bed ${bedByPatient.get(String(prescription.patient?._id))?.code || '-'} | ${medicine.dosage || medicine.doseCount || ''} ${medicine.timing || medicine.frequency || ''}`
    })));
    const doctorTasks = assignedTasks.map((task) => ({
      type: 'Doctor Assigned',
      patient: task.patient,
      title: task.title,
      priority: task.priority,
      detail: `Bed ${task.bed?.code || '-'} | Dr. ${task.doctor?.name || '-'} | ${task.detail || ''}`
    }));
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    res.json([...baseTasks, ...doctorTasks, ...vitalTasks, ...medicationTasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]));
  } catch (error) {
    next(error);
  }
}

async function listVitals(req, res, next) {
  try {
    const query = req.query.patient ? { patient: req.query.patient } : {};
    res.json(await Vital.find(query).populate(['patient', 'nurse']).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

async function upsertBed(req, res, next) {
  try {
    const bed = await Bed.findOneAndUpdate({ code: req.body.code }, req.body, { upsert: true, new: true });
    emitAll('bed:update', bed);
    res.json(bed);
  } catch (error) {
    next(error);
  }
}

async function listBeds(_req, res, next) {
  try {
    res.json(await Bed.find().populate('patient', '-password').sort('code'));
  } catch (error) {
    next(error);
  }
}

function classifyRisk(vital) {
  const oxygen = Number(vital.oxygenLevel || 100);
  const pulse = Number(vital.pulse || 80);
  const temp = Number(vital.temperature || 98.6);
  if (oxygen < 90 || pulse > 130 || temp >= 103) return 'Critical';
  if (oxygen < 94 || pulse > 110 || temp >= 101) return 'High';
  if (oxygen < 97 || pulse > 95 || temp >= 99.5) return 'Medium';
  return 'Low';
}

module.exports = { createVital, listVitals, assignedPatients, tasks, upsertBed, listBeds };
