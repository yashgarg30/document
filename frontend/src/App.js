import React from 'react';
import Upload from './components/Upload';
import Search from './components/Search';

export default function App() {
  return (
    <div style={{ maxWidth: 900, margin: '20px auto', padding: '0 20px' }}>
      <h1>MERN OCR Search</h1>
      <Upload />
      <hr style={{ margin: '30px 0' }} />
      <Search />
    </div>
  );
}