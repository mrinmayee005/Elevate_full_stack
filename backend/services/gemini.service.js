const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('../config/env');

async function generateMedicalText({ feature, role, language, input }) {
  const prompt = [
    'You are LifeCare Hospital, a healthcare assistant.',
    'Provide useful, cautious clinical support, not a final diagnosis.',
    'Include emergency red flags and recommend professional care when appropriate.',
    `Feature: ${feature}`,
    `Requester role: ${role}`,
    `Response language: ${language || 'English'}`,
    'Return only plain text. Do not use markdown symbols, asterisks, tables, or model/provider names.',
    'Use this exact simple format with maximum 8 short lines:',
    'Key Finding: ...',
    'Health Impact: ...',
    'Recommended Action: ...',
    'Important Warning: ...',
    'Extra Note: ...',
    `Input:\n${typeof input === 'string' ? input : JSON.stringify(input, null, 2)}`
  ].join('\n\n');
  return generateTextWithProviders(prompt, textModelCandidates(env.geminiTextModel));
}

async function analyzeMedicalImage({ feature, language, file, context }) {
  const imagePart = {
    inlineData: {
      data: file.buffer.toString('base64'),
      mimeType: file.mimetype
    }
  };
  const prompt = [
    'Analyze this healthcare image or document for LifeCare Hospital.',
    'It may be a report, prescription, medicine strip, bottle, or package.',
    'Identify the document type, key findings, medicines if any, warnings, and simple next steps.',
    'Keep the response short, simple, patient-friendly, and structured.',
    'Return only plain text. Do not use markdown symbols, asterisks, tables, or model/provider names.',
    'Use maximum 8 short lines with labels: Document Type, Key Finding, Health Impact, Recommended Action, Important Warning.',
    `Feature: ${feature}`,
    `Response language: ${language || 'English'}`,
    `Context: ${context || 'No extra context'}`
  ].join('\n\n');
  return generateVisionWithProviders(prompt, imagePart, file, textModelCandidates(env.geminiVisionModel));
}

function textModelCandidates(preferred) {
  return [...new Set([preferred, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'].filter(Boolean))];
}

async function generateWithFallback(genAI, models, content) {
  let lastError;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(content);
      const text = result.response.text();
      if (text && text.trim()) return text;
      lastError = new Error('The analysis service returned an empty response');
    } catch (error) {
      lastError = error;
    }
  }
  const error = new Error(lastError?.message || 'Primary AI request failed');
  error.status = 502;
  throw error;
}

async function generateTextWithProviders(prompt, models) {
  const errors = [];
  if (env.geminiApiKey) {
    try {
      return await generateWithFallback(new GoogleGenerativeAI(env.geminiApiKey), models, prompt);
    } catch (error) {
      errors.push(error.message);
    }
  }
  if (env.openaiApiKey) {
    try {
      return await generateSecondaryAI([
        { role: 'system', content: 'You are LifeCare Hospital, a cautious healthcare assistant. Do not provide final diagnosis. Encourage professional care for serious symptoms. Use plain text only. Do not use markdown.' },
        { role: 'user', content: prompt }
      ]);
    } catch (error) {
      errors.push(error.message);
    }
  }
  const error = new Error('Analysis service is unavailable. Please configure a valid AI key.');
  error.status = 503;
  throw error;
}

async function generateVisionWithProviders(prompt, imagePart, file, models) {
  const errors = [];
  if (env.geminiApiKey) {
    try {
      return await generateWithFallback(new GoogleGenerativeAI(env.geminiApiKey), models, [prompt, imagePart]);
    } catch (error) {
      errors.push(error.message);
    }
  }
  if (env.openaiApiKey) {
    try {
      const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return await generateSecondaryAI([
        { role: 'system', content: 'You are LifeCare Hospital, a cautious healthcare vision assistant. Use plain text only. Do not use markdown.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ]);
    } catch (error) {
      errors.push(error.message);
    }
  }
  const error = new Error('Document scanner is unavailable. Please configure a valid vision AI key.');
  error.status = 503;
  throw error;
}

async function generateSecondaryAI(messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.openaiModel,
      messages,
      temperature: 0.3
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Secondary analysis HTTP ${response.status}`);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Secondary analysis returned an empty response');
  return text;
}

module.exports = { generateMedicalText, analyzeMedicalImage };
