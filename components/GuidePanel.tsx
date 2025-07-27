import React from 'react';

const GuidePanel: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 overflow-y-auto text-slate-300 h-full">
      <div className="prose prose-invert prose-slate max-w-none prose-h2:font-bold prose-h2:text-2xl prose-h2:mb-4 prose-h3:font-semibold prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:text-slate-300 prose-li:text-slate-300 prose-a:text-blue-400 hover:prose-a:text-blue-300">
        <h2>How to Use the AI Marketing Meeting Room</h2>
        <p>
          Welcome! This application simulates a marketing team meeting using AI-powered personas. You act as the facilitator, setting the stage and guiding the discussion. Here’s how to get started:
        </p>

        <h3>Step 1: Setup Your Meeting (Settings Panel)</h3>
        <p>Everything you need to configure is in the left-hand settings panel.</p>
        <ol>
            <li>
                <strong>Define Your AI Team:</strong> The "AI Personas" section is where you build your team. You can use the default personas or create your own by clicking the <code>+</code> button. Each persona needs a name and a role/description, which guides their personality and contributions during the meeting.
            </li>
            <li>
                <strong>Add API Keys:</strong> The application uses the Google Gemini API. Add one or more API keys in the "API Keys" section.
                <ul>
                  <li>Click "Add" to save a key.</li>
                  <li>Click the checkmark icon next to a key to verify its status. A key must be "Active" to be used.</li>
                  <li>The app will automatically rotate between active keys if one hits a rate limit.</li>
                </ul>
            </li>
            <li>
                <strong>Set the Meeting Topic:</strong> In the "Meeting Topic" text area, enter the subject for your AI team to discuss. This can be a question, a problem to solve, or a topic to brainstorm.
            </li>
        </ol>

        <h3>Step 2: Start the Meeting</h3>
        <p>
          Once you have at least one persona, one active API key, and a meeting topic, the "Start Meeting" button will become enabled. Click it to begin.
        </p>
        <p>
          The AI Orchestrator will first create a 3-point agenda based on your topic and present it in the chat. Then, the personas will begin discussing the agenda items one by one.
        </p>
        
        <h3>Step 3: Facilitate the Discussion</h3>
        <p>
          While the meeting is running, you can guide the conversation. A message input box will appear at the bottom of the meeting room.
        </p>
        <ul>
            <li>Type a question or comment and press Enter or the Send button.</li>
            <li>Your message will be shown to the next AI persona whose turn it is to speak, influencing their response.</li>
            <li>The input box is disabled while an AI is "thinking" to prevent spamming.</li>
        </ul>
        
        <h3>Step 4: Conclude the Meeting</h3>
        <p>
          The meeting automatically concludes after all agenda items have been discussed by all personas. At the end, the AI Orchestrator will provide a comprehensive summary, including key takeaways and action items.
        </p>
        <p>
          You can also stop the meeting at any time by clicking the "Stop Meeting" button.
        </p>

        <h3>Tips & Tricks</h3>
        <ul>
            <li><strong>Detailed Roles:</strong> The more descriptive you make a persona's role, the more nuanced their responses will be.</li>
            <li><strong>Multiple Keys:</strong> Using multiple API keys can help avoid interruptions from rate limits, especially for longer meetings.</li>
            <li><strong>Reset:</strong> The "Reset" button clears the chat history, allowing you to start a fresh discussion with the same settings.</li>
        </ul>
      </div>
    </div>
  );
};

export default GuidePanel;