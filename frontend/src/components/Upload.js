import React, { useState, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 10000
});

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState({});
  const [connected, setConnected] = useState(false);

  React.useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnected(true);
      setStatus('Ready to upload');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
      setStatus('Connection error - please try again');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
      setStatus('Disconnected - please refresh');
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, []);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setProgress({});
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:4000/api/upload', formData);
      const { documentId } = response.data;
      
      setStatus('Processing...');
      
      // Remove any existing listeners
      socket.off('page');
      socket.off('done');
      socket.off('failed');
      socket.off('joined');
      
      // Set up new listeners for this upload
      socket.on('joined', ({ docId }) => {
        console.log('Joined document room:', docId);
        setStatus('Processing started...');
      });
      
      socket.on('page', data => {
        console.log('Received page update:', data);
        setProgress(prev => ({ ...prev, [data.page]: data }));
      });

      socket.on('done', () => {
        console.log('Processing complete');
        setStatus('Complete!');
        // Clean up listeners
        socket.off('page');
        socket.off('done');
        socket.off('failed');
      });

      socket.on('failed', ({ error }) => {
        console.error('Processing failed:', error);
        setStatus(`Failed: ${error}`);
        // Clean up listeners
        socket.off('page');
        socket.off('done');
        socket.off('failed');
      });
      
      // Join the document room
      console.log('Joining document room:', documentId);
      socket.emit('joinDoc', documentId);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <h3>Upload Document</h3>
      <form onSubmit={onSubmit}>
        <input type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff" onChange={onFileChange} />
        <button type="submit" disabled={!file}>Upload</button>
      </form>

      {status && <p>{status}</p>}
      
      {Object.entries(progress).map(([page, data]) => (
        <div key={page}>
          Page {page}: {data.status} {data.confidence ? `(${Math.round(data.confidence)}% confidence)` : ''}
        </div>
      ))}
    </div>
  );
}