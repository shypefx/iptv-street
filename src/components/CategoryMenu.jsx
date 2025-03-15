// src/components/CategoryMenu.jsx
import { useState } from 'react';
import { useIPTV } from '../contexts/IPTVContext';

export default function CategoryMenu() {
  const { 
    categories, 
    subcategories,
    activeCategory, 
    activeSubcategory,
    setActiveCategory,
    setActiveSubcategory
  } = useIPTV();
  
  const [expandedCategories, setExpandedCategories] = useState({});
  
  const toggleExpand = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const handleCategoryClick = (category) => {
    // If clicking on a category with subcategories, toggle expansion
    if (subcategories[category] && subcategories[category].length > 0) {
      toggleExpand(category);
    }
    
    // Always set active category
    setActiveCategory(category);
    setActiveSubcategory(null);
  };
  
  const handleSubcategoryClick = (category, subcategory) => {
    setActiveCategory(category);
    setActiveSubcategory(subcategory);
  };

  return (
    <div className="category-menu">
      <h3 className="category-menu-title">Categories</h3>
      
      <ul className="category-list">
        {categories.map(category => (
          <li key={category} className="category-item">
            <div 
              className={`category-header ${activeCategory === category ? 'active' : ''}`} 
              onClick={() => handleCategoryClick(category)}
            >
              <span className="category-name">{category}</span>
              
              {subcategories[category] && subcategories[category].length > 0 && (
                <span className={`expand-icon ${expandedCategories[category] ? 'expanded' : ''}`}>
                  {expandedCategories[category] ? '−' : '+'}
                </span>
              )}
            </div>
            
            {subcategories[category] && subcategories[category].length > 0 && expandedCategories[category] && (
              <ul className="subcategory-list">
                {subcategories[category].map(subcategory => (
                  <li 
                    key={subcategory} 
                    className={`subcategory-item ${activeSubcategory === subcategory ? 'active' : ''}`}
                    onClick={() => handleSubcategoryClick(category, subcategory)}
                  >
                    {subcategory}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
