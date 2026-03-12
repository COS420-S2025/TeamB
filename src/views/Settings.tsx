import React from 'react';
import { Header } from '../components/Header';

interface SettingsProps {
  onBack: () => void;
  onContactList: () => void;
  onReportIssue: () => void;
  onSuggestChange: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function Settings({ onBack, onContactList, onReportIssue, onSuggestChange, onAdd, onRemove }: SettingsProps) {
  return (
    <div className="bee-screen">
      <Header showBack onBack={onBack} onAdd={onAdd} onRemove={onRemove} />
      <main className="bee-content">
        <div className="bee-settings-options">
          <button className="bee-settings-btn" onClick={onContactList}>
            Contact List
          </button>
          <button className="bee-settings-btn" onClick={onReportIssue}>
            Report an Issue
          </button>
          <button className="bee-settings-btn" onClick={onSuggestChange}>
            Suggest a Change
          </button>
        </div>
      </main>
    </div>
  );
}
