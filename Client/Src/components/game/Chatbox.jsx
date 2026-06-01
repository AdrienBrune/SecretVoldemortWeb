import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Chatbox.css';
import { useGame } from '../../context/GameContext';

export default function Chatbox({ players }) {

  const { myUuid, chatMessageList, sendCommand } = useGame();

  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const prevMessagesCountRef = useRef(chatMessageList.length);

  const playersMap = React.useMemo(() => {
    const map = new Map();
    players?.forEach(p => map.set(p.uuid, p.name));
    return map;
  }, [players]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessageList]);

  useEffect(() => {
    const currentCount = chatMessageList.length;
    const prevCount = prevMessagesCountRef.current;
    
    prevMessagesCountRef.current = currentCount;

    if (!isOpen && currentCount > prevCount) {
      setHasNewMessage(true);
      const timer = setTimeout(() => {
        setHasNewMessage(false);
      }, 2400); 
      return () => clearTimeout(timer);
    }
  }, [chatMessageList, isOpen]);


  const getPlayerNameFromUuid = (uuid) => {
    return playersMap.get(uuid) || "inconnu";
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setHasNewMessage(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === "")
      return;
    sendCommand({
      command: "chatbox",
      chatbox: inputValue
    })
    setInputValue("");
  };

  return (
    <div className={`chat-sliding-panel ${isOpen ? 'open' : 'closed'}`}>
      {/* Onglet/Poignée du chat */}
      <div 
        className={`chat-handle ${isOpen ? 'open' : (hasNewMessage ? 'notify-animation' : 'close')}`}
        onClick={toggleChat}
      >
      </div>
      {/* Contenu du Chat */}
      <div className="chat-content">
        <div className="chat-header">
          <h3>Discussions</h3>
          <div className="chat-close" onClick={toggleChat}>X</div>
        </div>
        <div className="chat-messages">
          {chatMessageList.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.uuid === myUuid ? "me" : "other"}`}>
              <div className="message-entete">
                {getPlayerNameFromUuid(msg.uuid)}
              </div>
              <div className="message-bubble">
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="chat-input-area">
          <input
            type="text"
            placeholder="Votre message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit">Envoyer</button>
        </form>
      </div>
    </div>
  );
}