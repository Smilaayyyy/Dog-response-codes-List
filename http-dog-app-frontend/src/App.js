import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Search from './components/Search';
import Lists from './components/Lists';
import ListDetail from './components/ListDetail';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    
                    <Route path="*" element={<Signup />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/lists" element={<Lists />} />
                    <Route path="/list/:id" element={<ListDetail />} />
                    
                </Routes>
            </div>
        </Router>
    ); 
}

export default App;

