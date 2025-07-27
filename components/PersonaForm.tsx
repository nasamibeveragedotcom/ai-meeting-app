
import React, { useState, useEffect } from 'react';
import { Persona } from '../types';

interface PersonaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: Persona) => void;
  personaToEdit: Persona | null;
}

const PersonaForm: React.FC<PersonaFormProps> = ({ isOpen, onClose, onSave, personaToEdit }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (personaToEdit) {
      setName(personaToEdit.name);
      setRole(personaToEdit.role);
    } else {
      setName('');
      setRole('');
    }
  }, [personaToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
        alert("Name and Role cannot be empty.");
        return;
    };

    onSave({
      id: personaToEdit ? personaToEdit.id : new Date().toISOString(),
      name,
      role,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity">
      <div className="bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4 transform transition-all">
        <h2 className="text-2xl font-bold mb-6 text-white">{personaToEdit ? 'Edit Persona' : 'Add New Persona'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-slate-300 text-sm font-bold mb-2">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Jane Doe"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="role" className="block text-slate-300 text-sm font-bold mb-2">Role / Description</label>
            <textarea
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="e.g., SEO Specialist focused on organic growth"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Save Persona
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonaForm;
