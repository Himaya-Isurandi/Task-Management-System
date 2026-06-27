import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ 
  placeholder = 'Search...', 
  value = '', 
  onChange, 
  filters = null,
  className = ''
}) {
  const handleChange = (e) => {
    // Support both onChange(string) and onChange(event) patterns
    if (onChange) onChange(e.target.value);
  };

  return (
    <div className={`search-bar-container ${className}`} style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
      <div className="input-field-prefixed" style={{ flex: 1 }}>
        <span className="input-prefix" style={{ borderRight: 'none', display: 'flex', alignItems: 'center' }}>
          <Search size={18} />
        </span>
        <input 
          type="text" 
          placeholder={placeholder} 
          value={value} 
          onChange={handleChange}
          style={{ paddingLeft: '4px' }}
        />
      </div>
      {filters && (
        <div className="search-filters" style={{ display: 'flex', gap: '10px' }}>
          {filters}
        </div>
      )}
    </div>
  );
}
