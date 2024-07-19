import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ListingPage.css'; // Import the CSS file for styling

function Lists() {
    const [lists, setLists] = useState([]);
    const [editingList, setEditingList] = useState(null);
    const [newListName, setNewListName] = useState('');

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/Lists');
                setLists(res.data);
            } catch (error) {
                console.error('Failed to fetch lists', error);
            }
        };

        fetchLists();
    }, []);

    const handleEditClick = (list) => {
        setEditingList(list);
        setNewListName(list.listName);
    };

    const handleEditSave = async () => {
        try {
            await axios.put(`http://localhost:5000/api/Lists/${editingList._id}`, {
                listName: newListName,
                creationDate: editingList.creationDate,
                responseCodes: editingList.responseCodes,
                imageLinks: editingList.imageLinks
            });
            // Update the local state
            setLists(lists.map(list => (list._id === editingList._id ? { ...list, listName: newListName } : list)));
            setEditingList(null);
        } catch (error) {
            console.error('Failed to update list', error);
        }
    };

    const handleDeleteClick = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/Lists/${id}`);
            // Remove the deleted list from the local state
            setLists(lists.filter(list => list._id !== id));
        } catch (error) {
            console.error('Failed to delete list', error);
        }
    };

    return (
        <div className="lists-container">
            <h2>Lists</h2>
            {lists.length > 0 ? (
                <ul className="lists-list">
                    {lists.map(list => (
                        <li key={list._id} className="list-item">
                            {editingList && editingList._id === list._id ? (
                                <div className="edit-container">
                                    <input
                                        type="text"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        className="edit-input"
                                    />
                                    <button onClick={handleEditSave} className="save-button">Save</button>
                                    <button onClick={() => setEditingList(null)} className="cancel-button">Cancel</button>
                                </div>
                            ) : (
                                <div className="list-info">
                                    <span className="list-name">{list.listName}</span>
                                    <div className="button-group">
                                        <button onClick={() => handleEditClick(list)} className="edit-button">Edit</button>
                                        <button onClick={() => handleDeleteClick(list._id)} className="delete-button">Delete</button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No lists available.</p>
            )}
        </div>
    );
}

export default Lists;
