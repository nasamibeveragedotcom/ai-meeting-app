import React from 'react';

const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.372c-1.03.103-1.98-.7-1.98-1.728V9.511c0-.999.95-1.83 1.98-1.728l3.722.372ZM9.75 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.372c-1.03.103-1.98-.7-1.98-1.728V9.511c0-.999.95-1.83 1.98-1.728l3.722.372Z" />
  </svg>
);

export default ChatBubbleLeftRightIcon;