import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './SearchPage.css';

function Search() {
    const [filter, setFilter] = useState('');
    const [images, setImages] = useState([]);
    const [listName, setListName] = useState('');
    const [creationDate, setCreationDate] = useState('');
    const [savedResponseCodes, setSavedResponseCodes] = useState([]);
    const [savedImageLinks, setSavedImageLinks] = useState([]);

    const handleSearch = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/search?filter=${filter}`);
            const imageUrls = res.data.imageUrls.map(url => ({ code: filter, imageUrl: url }));
            setImages(imageUrls);
            setSavedResponseCodes([filter]);  // Assuming the filter is the response code
            setSavedImageLinks(imageUrls.map(img => img.imageUrl));
        } catch (error) {
            console.error('Search failed', error);
        }
    };

    const handleSaveList = async () => {
        try {
            const data = {
                listName: listName,
                creationDate: creationDate,
                responseCodes: savedResponseCodes,
                imageLinks: savedImageLinks
            };

            const response = await axios.post('http://localhost:5000/api/Lists', data);
            console.log('List saved successfully:', response.data);
        } catch (error) {
            console.error('Failed to save list', error);
        }
    };

    return (
        <div className="search-page">
            <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Enter response code or pattern" />
            <button onClick={handleSearch}>Search</button>
            <div>
                {images.map(img => (
                    <img key={img.code} src={img.imageUrl} alt={`Response code ${img.code}`} />
                ))}
            </div>
            {/* Input fields for list details */}
            <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name"
            />
            <input
                type="text"
                value={creationDate}
                onChange={(e) => setCreationDate(e.target.value)}
                placeholder="Enter creation date"
            />

            {/* Save button */}
            <button onClick={handleSaveList}>Save List</button>
            <Link to="/Lists">Show Lists</Link>
        </div>
    );
}

export default Search;
