import "./App.css";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from "react";
import html2canvas from 'html2canvas';
import axios from 'axios';

function Home() {
  const navigate = useNavigate();

  function LoadStart() {
    navigate('/start');
  }

  function LoadPrevious() {
    navigate('/previous');
  }

  return (
    <div>
      <h1>EEEBalanceBug-Application</h1>
      <button onClick={LoadStart}>Start new test</button>
      <button onClick={LoadPrevious}>Load previous test</button>
    </div>
  );
}

function Start({ table, setInput, input }) {
  const navigate = useNavigate();

  function handleInput({ target }) {
    setInput(target.value);
  }

  function handleInputPass() {
    if (input.trim() === '') {
      alert('INVALID NAME');
      return;
    } else if (table.some(entry => entry.id === input.trim())) {
      alert('NAME ALREADY TAKEN, PLEASE TRY AGAIN');
      return;
    }
    navigate('/maze');
  }

  return (
    <div>
      <h1>Start new test</h1>
      <input type="text" id="testname" placeholder="Enter a test name" value={input} onChange={handleInput} />
      <button onClick={handleInputPass}>Submit</button>
    </div>
  );
}

function Previous({ table }) {

  function handleDeletes(index) {
    const recordIdToDelete = table[index].id;

    axios.delete(`http://34.227.197.134:3001/records/${recordIdToDelete}`)
      .then((response) => {
        console.log(response.data.message);
      })
      .catch((error) => {
        console.error('Error deleting record:', error.response.data.error);
      });
  }

  return (
    <>
      <h1>Load previous test</h1>
      <table>
        <thead>
          <tr>
            <th>Test-name</th>
            <th>Visit</th>
            <th>Date and Time</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {table.map((entry, i) => {
            return (
              <tr key={i}>
                <td>{entry.id}</td>
                <td>
                  <a target="_blank" href={entry.image} rel="noreferrer">
                    Click me
                  </a>
                </td>
                <td>{entry.date_field}</td>
                <td><button onClick={() => handleDeletes(i)}>Delete</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function Maze({input, setInput, sensor, begin, end, setBegan, began}) {
  const navigate = useNavigate();
  const [cur, setCur] = useState({ x: 440, y: 0 });
  const [trace, setTrace] = useState([]);

  function beginMaze(){
    setBegan(1);
    begin().then((temp) => console.log(`Began ${temp}`)).catch((error) => console.log(`Error: ${error}`));
  }

  const goBack = useCallback(() => {
    html2canvas(document.querySelector('.maze-container'))
      .then((canvas) => {
        const scaledCanvas = document.createElement('canvas');
        const scaledContext = scaledCanvas.getContext('2d');
        scaledCanvas.width = canvas.width / 2;
        scaledCanvas.height = canvas.height / 2;
        scaledContext.drawImage(
          canvas,
          0,
          0,
          scaledCanvas.width,
          scaledCanvas.height
        );

        const imageurl = scaledCanvas.toDataURL();
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];

        const entry = {
          id: input.trim(),
          image: imageurl,
          date_field: formattedDate,
        };

      end().then((temp) => console.log(`Ended ${temp}`)).catch((error) => console.log(`Error: ${error}`));

      setBegan(0);

        return axios.post('http://34.227.197.134:3001/records', entry);
      })
      .then((response) => {
        console.log(response.data.message);
      })
      .catch((error) => {
        console.error('Error capturing canvas or adding record:', error);
      })
      .finally(() => {
        navigate('/');
        setInput('');
      });
  }, [input, navigate, setInput, end, setBegan]);

  useEffect(() => {

    let leftSpeed = sensor.leftSpeed; 
    let rightSpeed = sensor.rightSpeed; 
    let distancePerStep = 2.5;
  
    let linearSpeed = (leftSpeed + rightSpeed) / 2; 
  
    let angle = sensor.currentAngle; 
    let radian = (angle * Math.PI) / 180;
  
    let newX = cur.x + ((linearSpeed * 0.01 * distancePerStep * 2) * Math.cos(radian));
    let newY = cur.y + ((linearSpeed * 0.01 * distancePerStep * 2) * Math.sin(radian));
  
    newX = Math.max(0, Math.min(440, newX));
    newY = Math.max(0, Math.min(630, newY));

  if(began){
    setCur({ x: newX, y: newY });
  }
  }, [sensor.leftSpeed, sensor.rightSpeed, sensor.currentAngle, began]);
  

  useEffect(() => {
    setTrace((prev) => [...prev, cur]);
  }, [cur]);

  return (
    <>
      <div>
        <div className="maze-container">
          {trace.map((pos, index) => (
            <div
              key={index}
              className="maze-dot"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
              }}
            ></div>
          ))}
          <div
            className="maze-dot maze-current-dot"
            style={{
              transform: `translate(${cur.x}px, ${cur.y}px)`,
            }}
          ></div>
        </div>
      </div>
      <button onClick={beginMaze}>Start</button>
      <button onClick={goBack}>Back</button>
      <p>{began}</p>
    </>
  );
}

function App() {
  const [table, setTable] = useState([]);
  const [input, setInput] = useState('');
  const [sensor, setSensor] = useState({leftMotorSpeed: 0, rightMotorSpeed: 0, angle: 0});
  const [began, setBegan] = useState(0);
  const url = 'http://192.168.217.81:80'

  const fetchRecords = () => {
    return axios.get('http://34.227.197.134:3001/records')
      .then((response) => {
        console.log('Fetched records:', response.data);
        return response.data;
      })
      .catch((error) => {
        console.error('Error fetching records:', error.response.data.error);
      });
  };

  const fetchSensorData = () => {
    return axios.get(`${url}/sensorData`)
      .then((response) => {
        console.log('Fetched sensor data:', response.data);
        return response.data;
      })
      .catch((error) => {
        console.log('Error fetching sensor data:', error);
      });
  };

  const end = () => {
    return axios.get(`${url}/end`)
      .then((response) => {
        console.log('Ended:', response.data);
        return response.data;
      })
      .catch((error) => {
        console.log('Error in ending:', error.response.data.error);
      });
  };

  const begin = () => {
    return axios.get(`${url}/start`)
      .then((response) => {
        console.log('Begin:', response);
        return response;
      })
      .catch((error) => {
        console.log('Error in beginning:', error.response.data.error);
      });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecords()
        .then((temp) => {
          setTable(temp);
        })
        .catch((error) => {
          console.error('Error fetching records:', error);
        });
    }, 100);
  
    const sensorInterval = setInterval(() => {
        fetchSensorData()
        .then((temp) => {
          setSensor(temp);
        })
        .catch((error) => {
          console.error('Error fetching sensor data:', error);
        });
    }, 10);

    return () => {clearInterval(interval);
                  clearInterval(sensorInterval);}}, []);

  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/maze" element={<Maze setInput={setInput} input={input} sensor={sensor} begin={begin} end={end} setBegan={setBegan} began={began}/>} />
        <Route path="/start" element={<Start table={table} setInput={setInput} input={input} />} />
        <Route path="/previous" element={<Previous table={table} />} />
      </Routes>
    </Router>
  );
}

export default App;
