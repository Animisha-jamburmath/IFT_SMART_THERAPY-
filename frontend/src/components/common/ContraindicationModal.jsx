import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

const contraindications = [
  'Acute myocardial infarction (heart attack) or recent unstable cardiac events within the last 2 to 3 days.',
  'Unstable angina or severe, uncontrolled resting heart failure and arrhythmias.',
  'Active deep vein thrombosis (DVT) or pulmonary embolism due to the risk of dislodging a blood clot.',
  'Acute systemic infections accompanied by a high fever.',
  'Recent arterial dissection or acute aortic aneurysm.',
  'Lack of patient consent or inability to cooperate due to severe altered mental status.',
];

const ContraindicationModal = ({ onAgree, onDismiss, open }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="bg-danger px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <FiAlertTriangle size={28} />
            <h2 className="text-xl font-bold">Absolute Contraindications</h2>
          </div>
          <button onClick={onDismiss} className="text-white/80 hover:text-white"><FiX size={28} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <ul className="space-y-3">
            {contraindications.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="text-danger font-bold mt-0.5">⚠</span><span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button onClick={onDismiss} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Dismiss</button>
          <button onClick={onAgree} className="px-6 py-2 bg-success text-white rounded-lg hover:bg-green-700">I Agree</button>
        </div>
      </div>
    </div>
  );
};

export default ContraindicationModal;