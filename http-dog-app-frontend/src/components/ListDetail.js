import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const ListDetail = () => {
    const { id } = useParams();
    const [list, setList] = useState(null);
    const [listName, setListName] = useState('');
    const [responseCodes, setResponseCodes] = useState([]);
    const [imageLinks, setImageLinks] = useState([]);
    const [similarLists, setSimilarLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchList();
    }, []);

    const fetchList = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/Lists/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            const listData = response.data;
            setList(listData);
            setListName(listData.listName);
            setResponseCodes(listData.responseCodes);
            setImageLinks(listData.imageLinks);

            // Fetch lists with the same name
            const similarListsResponse = await axios.get(`http://localhost:5000/api/Lists?name=${listData.listName}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setSimilarLists(similarListsResponse.data);
        } catch (error) {
            console.error('Error fetching list:', error);
        }
    };

    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:5000/api/Lists/${id}`, {
                listName,
                responseCodes,
                imageLinks
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            navigate('/Lists'); // Navigate back to lists page after saving
        } catch (error) {
            console.error('Error updating list:', error);
        }
    };

    const handleListClick = async (listId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/Lists/${listId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setSelectedList(response.data);
        } catch (error) {
            console.error('Error fetching list details:', error);
        }
    };

    if (!list) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Edit List</h1>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div>
                    <label>List Name:</label>
                    <input
                        type="text"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                    />
                </div>
                <div>
                    <label>Response Codes:</label>
                    <textarea
                        value={responseCodes.join(', ')}
                        onChange={(e) => setResponseCodes(e.target.value.split(', '))}
                    />
                </div>
                <div>
                    <label>Image Links:</label>
                    <textarea
                        value={imageLinks.join(', ')}
                        onChange={(e) => setImageLinks(e.target.value.split(', '))}
                    />
                </div>
                <button type="submit">Save</button>
            </form>
            
            <h2>Similar Lists</h2>
            {similarLists.length > 0 ? (
                <ul>
                    {similarLists.map(similarList => (
                        <li key={similarList._id}>
                            <span>{similarList.listName}</span>
                            <button onClick={() => handleListClick(similarList._id)}>Show Details</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No other lists with the same name.</p>
            )}

            {selectedList && (
                <div>
                    <h2>Selected List Details</h2>
                    <div>
                        <h3>{selectedList.listName}</h3>
                        <p><strong>Response Codes:</strong> {selectedList.responseCodes.join(', ')}</p>
                        <p><strong>Image Links:</strong></p>
                        {selectedList.imageLinks.length > 0 ? (
                            <ul>
                                {selectedList.imageLinks.map((link, index) => (
                                    <li key={index}><img src={link} alt={`Response Code ${index}`} width="100" /></li>
                                ))}
                            </ul>
                        ) : (
                            <p>No images available</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListDetail;

