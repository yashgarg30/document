import React, { useState } from 'react';
import axios from 'axios';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const response = await axios.get(`http://localhost:4000/api/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
      setResults({ error: err.message });
    }
  };

  return (
    <div>
      <h3>Search Documents</h3>
      <form onSubmit={handleSearch}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search terms..."
          style={{ width: '300px' }}
        />
        <button type="submit">Search</button>
      </form>

      {results?.error && (
        <p style={{ color: 'red' }}>Error: {results.error}</p>
      )}

      {results?.results && (
        <div style={{ marginTop: '20px' }}>
          <h4>Found {results.total} documents</h4>
          {results.results.map(doc => (
            <div key={doc._id} style={{ marginBottom: '20px', padding: '10px', background: 'white', borderRadius: '4px' }}>
              <h5>{doc.title}</h5>
              {doc.snippets?.map((snippet, i) => (
                <div key={i} style={{ fontSize: '0.9em', marginBottom: '5px' }}>
                  <strong>Page {snippet.pageNumber}:</strong>{' '}
                  <span dangerouslySetInnerHTML={{ 
                    __html: snippet.snippet.replace(
                      new RegExp(query, 'gi'), 
                      match => `<mark>${match}</mark>`
                    )
                  }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}