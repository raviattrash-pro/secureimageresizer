import React, { useState } from 'react';
import { categories } from '../data/categories';
import type { Category } from '../data/categories';
import './ExamSearchInput.css';

interface Props {
  onSelect: (category: Category) => void;
}

export function ExamSearchInput({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Category[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length > 0) {
      const filtered = categories.filter(c => 
        c.name.toLowerCase().includes(q.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  const handleSelect = (category: Category) => {
    setQuery(category.name);
    setResults([]);
    onSelect(category);
  };

  return (
    <div className="search-container">
      <input 
        type="text" 
        className="search-input" 
        placeholder="Search for an exam or visa (e.g. UPSC, US Visa)..." 
        value={query}
        onChange={handleSearch}
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map(c => (
            <li key={c.id} onClick={() => handleSelect(c)}>
              {c.name} <span className="tag">{c.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
