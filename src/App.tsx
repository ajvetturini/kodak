import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import FileInput from './FileInput';
import WindowObject from './WindowObject';

const curVersion = '0.0.2';  // Version Release # / Build # / Iteration #

function App() {
  const [isExpanded, setIsExpanded] = useState(true);  // SET THIS TO TRUE WHEN DEPLOYING AND ADD A "DO NOT SHOW" OPTION TO HIDE THIS.
  const [rememberExpand, setRememberExpand] = useState(true); // Default to remember expand preference
  
  const [fileReadSuccessfully, setFileReadSuccessfully] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [windowObjects, setWindowObjects] = useState<{ title: string; description: string; closeable: boolean; showGraphSettingsBar?: boolean; plotData: any; graphType: string; position_x: number; position_y: number; vizData: any; metadata: any; onChange: boolean }[]>([]);
  const [clickCount, setClickCount] = useState(0);

  const handleWindowObjectClick = () => {
    // Increment click count when WindowObject is clicked
    // Note to self: This might be what is causing a refresh bug at point on the plotly figures...
    setClickCount(prevCount => prevCount + 1);
    return clickCount
  };

  // Callback function to create a new WindowObject from my App window.
  const createNewWindowObject = (xy: string, data: any) => {
    // Create a new WindowObject with the provided data
    const windowObjectData = { 
      title: xy, 
      description: `This window shows the visualization of the selected design from (X, Y): ${xy}`, 
      closeable: true, 
      showGraphSettingsBar: true, 
      plotData: data, // Data is the jsonData
      graphType: '3D_Scatter',  // Note to self: Change this to threeJS viz eventually for DNA representation?
      position_x: window.screen.width / 2, 
      vizData: {},
      position_y: window.screen.height / 2,
      metadata: [0, 0],
      onChange: false
    };


    // Implement a new WindowObject and append to the list:
    const newWindowObject = {
      title: windowObjectData.title,
      description: windowObjectData.description,
      closeable: windowObjectData.closeable,
      showGraphSettingsBar: windowObjectData.showGraphSettingsBar,
      plotData: windowObjectData.plotData,
      graphType: windowObjectData.graphType,
      position_x: windowObjectData.position_x,
      position_y: windowObjectData.position_y,
      vizData: windowObjectData.vizData,
      metadata: windowObjectData.metadata,
      onChange: windowObjectData.onChange
  };
    
  // Update the state to include the new WindowObject
  if (windowObjects.length >= 10) {
    // If it is, display an alert
    alert("Only 10 windows at max can be open at once to manage resources, see GitHub page to raise this value if desired.");
    } else {
        // If not, proceed to update the state with the new window object
        setWindowObjects([...windowObjects, newWindowObject]);
    }
};

// Callback function to update the plotData layout for a given WindowObject.
  const handleUpdatePlotLayout = (updatedLayout: any, identifier: string) => {
    // Update the plot layout at the top level
    const windowObjectIndex = windowObjects.findIndex(obj => obj.title === identifier);
    if (windowObjectIndex !== -1) {
        // Get the index of the windowObject with matching title
        const windowObject = windowObjects[windowObjectIndex];

        // We need to read in the plotData:
        let plotData = windowObject.plotData;
        let actualPlotData = {
            data: [],
            layout: {},
        };  // Set default value to a blank plotly figure
        try {
            actualPlotData = JSON.parse(plotData);
        } catch (error) {
            // Handle the error by just setting actualPlotData to plotData. This is useful for when passing in the problem definition block!
            actualPlotData = plotData;
        }

        // Update the layout while maintaining the same data
        actualPlotData.layout = updatedLayout;

        // Update the plotData property of the windowObject
        windowObject.plotData = JSON.stringify(actualPlotData);
        // Update the windowObjects array with the modified windowObject
        setWindowObjects(prevWindowObjects => {
            const updatedWindowObjects = [...prevWindowObjects];
            updatedWindowObjects[windowObjectIndex] = windowObject;
            return updatedWindowObjects;
        });
    } else {
        console.error(`WindowObject with title "${identifier}" not found.`);
    }
  };

  function arePlotsEqual(curPlot: any, updatedPlot: any): boolean {    
    // This function very simply checks for equivalent plots so I am updating the correct traces. Note that I am
    // really just checking x y z values, and for some plots this logic may break? We should consider this in the 
    // future.

    // Check if all elements in the x and y arrays are the same
    if (!curPlot.x.every((value: any, index: any) => value === updatedPlot.x[index]) ||
        !curPlot.y.every((value: any, index: any) => value === updatedPlot.y[index])) {
        return false;
    }

    // Check if z fields exist in both plots
    if (curPlot.z && updatedPlot.z) {    
        // Check if all elements in the z arrays are the same
        if (!curPlot.z.every((value: any, index: any) => value === updatedPlot.z[index])) {
            return false;
        }
    }

    // If all conditions are met, return true
    return true;
  };

  // Note to self: You are here, need to pass this into PlottingObject similar to about Layout.
  const handleUpdatePlotTrace = (updatedTrace: any, identifier: string) => {
    // Update the plot layout at the top level
    const windowObjectIndex = windowObjects.findIndex(obj => obj.title === identifier);
    
    if (windowObjectIndex !== -1) {
        // Get the index of the windowObject with matching title
        const windowObject = windowObjects[windowObjectIndex];

        // We need to read in the plotData:
        let plotData = windowObject.plotData;
        let actualPlotData: {
          data: any[];
          layout: {};
          } = {
              data: [],
              layout: {},
          };  // Set default value to a blank plotly figure
        try {
            actualPlotData = JSON.parse(plotData);
        } catch (error) {
            // Handle the error by just setting actualPlotData to plotData. This is useful for when passing in the problem definition block!
            actualPlotData = plotData;
        }
        if (!Array.isArray(actualPlotData.data)) {
          console.log("Dont update, data not an array.", actualPlotData.data);
      } else {
        const indices = actualPlotData.data.map((item, index) => {
            return arePlotsEqual(item, updatedTrace) ? index : null;
        }).filter((index): index is number => index !== null);

        //actualPlotData.data[idx] = updatedTrace;
        for (const idx of indices) {
          actualPlotData.data[idx] = updatedTrace; // Update each item by index
      }
        windowObject.plotData = JSON.stringify(actualPlotData);  

        // Update the windowObjects array with the modified windowObject
        setWindowObjects(prevWindowObjects => {
          const updatedWindowObjects = [...prevWindowObjects];
          updatedWindowObjects[windowObjectIndex] = windowObject;
          return updatedWindowObjects;
      });
      }        
    } else {
        console.error(`WindowObject with title "${identifier}" not found.`);
    }
  };


  // Functions for controlling the expand bar:

  /*const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };*/
  const toggleExpand = () => {
    setIsExpanded(prevExpanded => !prevExpanded);
    if (rememberExpand) {
      localStorage.setItem('rememberExpandPreference', JSON.stringify(!isExpanded));
    }
  };

  useEffect(() => {
    const rememberExpandPreference = localStorage.getItem('rememberExpandPreference');
    if (rememberExpandPreference) {
      setRememberExpand(JSON.parse(rememberExpandPreference));
    }
  }, []);

  useEffect(() => {
    if (rememberExpand) {
      setIsExpanded(true); // If rememberExpand is true, show the bar, otherwise don't:
    } else {
      setIsExpanded(false);
    }
  }, [rememberExpand]);

  const toggleRememberExpand = () => {
    setRememberExpand(rememberExpand => !rememberExpand);
    localStorage.setItem('rememberExpandPreference', JSON.stringify(!rememberExpand));
  };


  const handleWindowClose = (title: string) => {
    // Remove the window object with the given title from the array
    setWindowObjects(prevObjects => prevObjects.filter(obj => obj.title !== title));
  };


  const validateInnerObject = (obj: { [key: string]: any }) => {
    // Check if all required fields are present
    return (
        obj._title !== undefined &&
        obj._closeable !== undefined &&
        obj._description !== undefined &&
        obj._showgraphSettingsBar !== undefined &&
        obj._data !== undefined
    );
  };

  const read_json_data = (file: File, callback: (result: [boolean, string, any]) => void) => {
    // Read in JSON data
    // callback([true, 'None', jsonData]);
    // callback([false, `Can not open file, the fieldname ${combinedKey} is missing in the json file.`, null]);
    // return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const jsonData = JSON.parse(event.target?.result as string);
            for (const key in jsonData) {
              const innerObject = jsonData[key];
              for (const innerKey in innerObject) {
                  // const innerValue = innerObject[innerKey];
                  //if (typeof innerValue === 'object') {
                  if (typeof innerKey === 'object') {
                      // Validate inner object
                      // const isValid = validateInnerObject(innerValue);
                      const isValid = validateInnerObject(innerKey);
                      if (!isValid) {
                        // Handle invalid metadata
                          callback([false, `Can not open file, invalid metadata found in plots file.`, null]);
                          return;
                      }
                    }
                  }
                }
                // If we make it here, the data is correctly entered:
                callback([true, 'None', jsonData]);
            
        } catch (error) {
            // JSON parsing error
            console.error('Error parsing JSON:', error);
            callback([false, 'Can not open file due to JSON parsing error, please check your input file.', null]);
        }
    };

    // Read the file as text
    reader.readAsText(file);
};


  const read_in_file = async (file: File): Promise<[boolean, string, any]> => {
    // Check if the file is not null and has a name
    if (file && file.name) {
        // Get the file extension
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        // Check if the file extension is JSON
        if (fileExtension === 'plots' || fileExtension === 'json') {
            return new Promise((resolve, reject) => {
                // Read the JSON data asynchronously
                read_json_data(file, (result) => {
                    const [json_read_properly, message, data] = result;
                    // Now based on if json was read properly:
                    if (json_read_properly == true) {
                        resolve([json_read_properly, message, data]);
                    } else {
                        resolve([false, message, null]);
                    }
                });
            });
        } else {
            // File is not a JSON file
            return [false, 'Can not read file: File is not a JSON.', null];
        }
    } else {
        // File is null or does not have a name
        return [false, 'Can not read file: File is either a null or does not have a name.', null];
    }
  };
  

  const handleFileChange = async (file: File) => {
    // Handle file change logic here
    const [successfullyRead, message, dataFile] = await read_in_file(file); // Currently here...
    // var successfullyRead = true;
    // If successfullyRead -> We hide the drop-zone
    if (successfullyRead) {
      setFileReadSuccessfully(true);
      setShowDeleteButton(true);
      
      // Begin loop over field names:

      // First calculate out some parameters for determining position of new windows:
      // First extract out any "INTERACTIVE_DESIGN" elements from the dataFile
      // Define a new dictionary to store the extracted values
      const extractedValues: Record<string, any> = {};
      for (const key in dataFile) {
        if (Object.prototype.hasOwnProperty.call(dataFile, key)) {
          // Check if the key contains the substring "INTERACTIVE_DESIGN"
          if (key.includes("INTERACTIVE_DESIGN")) {
            // Extract the value associated with the key
            const value = dataFile[key];
            // Add the value to the extractedValues dictionary
            extractedValues[key] = value;
            // Remove the key from the dataFile object
            delete dataFile[key];
          }
        }
      }
      const numWindows = Object.keys(dataFile).length;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const numColumns = 3;
      const numRows = Math.ceil(numWindows / numColumns);
      const windowWidth = 525; // Width of each window
      const windowHeight = 400; // Height of each window
      const horizontalSpacing = 20; // Horizontal spacing between windows
      const verticalSpacing = 20; // Vertical spacing between windows
      const totalWidth = numColumns * (windowWidth + horizontalSpacing) - horizontalSpacing;

      const totalHeight = numRows * (windowHeight + verticalSpacing) - verticalSpacing;
      const startX = (screenWidth - totalWidth) / 2;
      const startY = (screenHeight - totalHeight) / 2;

      const newWindowObjects = [];
      let count = 0;
      let use_metadata = false;
      for (const plot in dataFile) {
        const windowObjectData = { title: "", description: "", closeable: false, showGraphSettingsBar: false, 
          plotData: null, graphType: '', position_x: (window.innerWidth - 300) / 2, vizData: {}, windowObjectSize: [1, 2],
          position_y: (window.innerHeight - 200) / 2, metadata: [0, 0], onChange: false };// The issue has to be something with this and why position_y is NaN
        const current_plot = dataFile[plot]  
        for (const fieldName in current_plot) {
            // Extract data from dataFile based on the combinedKey
            const dataPass = current_plot[fieldName];
            
            // Map the data to the corresponding field in the windowObjectData
            switch (fieldName) {
              case '_title':
                  windowObjectData.onChange = false;
                  windowObjectData.title = dataPass;
                  break;
              case '_description':
                  windowObjectData.description = dataPass;
                  break;
              case '_closeable':
                  windowObjectData.closeable = dataPass;
                  break;
              case '_showGraphSettingsBar':
                  if (dataPass == 'None') {
                    windowObjectData.showGraphSettingsBar = false;
                  } else {
                    windowObjectData.showGraphSettingsBar = true;
                  }
                  windowObjectData.graphType = dataPass;
                  break;
              case '_data':
                  // Assuming dataPass is the plot data, you can assign it to plotData
                  windowObjectData.plotData = dataPass;
                  break;
              case '_metadata':
                  use_metadata = true;
                  windowObjectData.metadata = dataPass;
                  /*
                  Will use this idea later once I figure it out more, time is not on my side!
                  windowObjectData.metadata = dataPass
                  windowObjectData.windowObjectSize = dataPass
                  */
                  break;
              default:
                  break;
          }
          }
          // Next pass in any vizData if in plots file:
          windowObjectData.vizData = extractedValues;

          // Now we add a new X and Y position to the windowObjectData:
          // Code to assign position for current windowName
          const row = Math.floor(count / numColumns);
          const col = count % numColumns;
          const posX = startX + col * (windowWidth + horizontalSpacing);
          const posY = startY + row * (windowHeight + verticalSpacing);
          if (!use_metadata) {
            windowObjectData.position_x = posX;
            windowObjectData.position_y = posY;
          }

          newWindowObjects.push(windowObjectData);
          count++;
      }

      // Add a new window object when the file is successfully read. This is where the plotting functionalities take place.
      /*setWindowObjects([
        { title: "Blank Window 1", description: "Description for blank window 1", closeable: true, showGraphSettingsBar: true, plotData: true},
        { title: "Blank Window 2", description: "Description for blank window 2", closeable: false, showGraphSettingsBar: false, plotData: true}
      ]);*/
      // Set windowObjects after the loop completes
      setWindowObjects(newWindowObjects);
    } else {
      alert(message);
    }

  };

  const handleUpdatePosition = (title: string, x: number, y: number) => {
    // Find the index of the window object with the matching title
    
    const index = windowObjects.findIndex(obj => obj.title === title);
    if (index !== -1) {
        // Create a copy of the window objects array
        const updatedWindowObjects = [...windowObjects];
        // Update the position of the window object at the found index
        updatedWindowObjects[index] = {
            ...updatedWindowObjects[index],
            metadata: [x, y]
        };
        // Update the state with the new window objects array
        setWindowObjects(updatedWindowObjects);
    }
};

const processFileData = (dataFile: any) => {
  // Assume dataFile is already the parsed JSON object
  setFileReadSuccessfully(true);
  setShowDeleteButton(true);
  const extractedValues: Record<string, any> = {};
  for (const key in dataFile) {
    if (Object.prototype.hasOwnProperty.call(dataFile, key)) {
      // Check if the key contains the substring "INTERACTIVE_DESIGN"
      if (key.includes("INTERACTIVE_DESIGN")) {
        // Extract the value associated with the key
        const value = dataFile[key];
        // Add the value to the extractedValues dictionary
        extractedValues[key] = value;
        // Remove the key from the dataFile object
        delete dataFile[key];
      }
    }
  }

  const numWindows = Object.keys(dataFile).length;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const numColumns = 3;
  const numRows = Math.ceil(numWindows / numColumns);
  const windowWidth = 525; // Width of each window
  const windowHeight = 400; // Height of each window
  const horizontalSpacing = 20; // Horizontal spacing between windows
  const verticalSpacing = 20; // Vertical spacing between windows
  const totalWidth = numColumns * (windowWidth + horizontalSpacing) - horizontalSpacing;

  const totalHeight = numRows * (windowHeight + verticalSpacing) - verticalSpacing;
  const startX = (screenWidth - totalWidth) / 2;
  const startY = (screenHeight - totalHeight) / 2;

  const newWindowObjects = [];
  let count = 0;
  let use_metadata = false;

  for (const plot in dataFile) {
    const windowObjectData = { title: "", description: "", closeable: false, showGraphSettingsBar: false, 
      plotData: null, graphType: '', position_x: (window.innerWidth - 300) / 2, vizData: {}, windowObjectSize: [1, 2],
      position_y: (window.innerHeight - 200) / 2, metadata: [0, 0], onChange: false };// The issue has to be something with this and why position_y is NaN
    const current_plot = dataFile[plot]  
    for (const fieldName in current_plot) {
        // Extract data from dataFile based on the combinedKey
        const dataPass = current_plot[fieldName];
        
        // Map the data to the corresponding field in the windowObjectData
        switch (fieldName) {
          case '_title':
              windowObjectData.title = dataPass;
              break;
          case '_description':
              windowObjectData.description = dataPass;
              break;
          case '_closeable':
              windowObjectData.closeable = dataPass;
              break;
          case '_showGraphSettingsBar':
              if (dataPass == 'None') {
                windowObjectData.showGraphSettingsBar = false;
              } else {
                windowObjectData.showGraphSettingsBar = true;
              }
              windowObjectData.graphType = dataPass;
              break;
          case '_data':
              // Assuming dataPass is the plot data, you can assign it to plotData
              windowObjectData.plotData = dataPass;
              break;
          case '_metadata':
              use_metadata = true;
              /*
              Will use this idea later once I figure it out more, time is not on my side!
              windowObjectData.metadata = dataPass
              windowObjectData.windowObjectSize = dataPass
              */
              break;
          default:
              break;
      }
      }
      // Next pass in any vizData if in plots file:
      windowObjectData.vizData = extractedValues;

      // Now we add a new X and Y position to the windowObjectData:
      // Code to assign position for current windowName
      const row = Math.floor(count / numColumns);
      const col = count % numColumns;
      const posX = startX + col * (windowWidth + horizontalSpacing);
      const posY = startY + row * (windowHeight + verticalSpacing);
      if (!use_metadata) {
        windowObjectData.position_x = posX;
        windowObjectData.position_y = posY;
      }

      newWindowObjects.push(windowObjectData);
      count++;
  }

  // Finally, update the state with the new window objects
  setWindowObjects(newWindowObjects);
};



const loadExampleFile = async (fileName: string) => {
  try {
    const response = await fetch(fileName);
    const data = await response.json();
    // Assuming handleFileChange or a similar function can accept and process this data directly
    processFileData(data); // Implement this function based on how you process the uploaded files
  } catch (error) {
    console.error("Failed to load example file:", error);
  }
};

  const handleDeleteFile = () => {
    // Perform logic to delete the file from memory
    setFileReadSuccessfully(false);
    setShowDeleteButton(false);
    // Close all window objects when the file is deleted
    setWindowObjects([]);
  };

  const handleSavePlots = () => {
    const outputDict: { [key: string]: any } = {};

    // Loop over each window object
    windowObjects.forEach((windowObject) => {
        // Extract the necessary data
        const { title, closeable, description, plotData, graphType, metadata} = windowObject;
        // Construct the object to be saved
        const dataToSave = {
            _title: title,
            _closeable: closeable,
            _description: description,
            _showGraphSettingsBar: graphType,  // Dont ask why these dont match... oops
            _data: plotData,
            _metadata: metadata
        };

        // Add the data to the output dictionary
        outputDict[title] = dataToSave;
    });

    // Convert the output dictionary to a JSON string
    const jsonData = JSON.stringify(outputDict, null, 2);

    // Create a blob from the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'new_plots.plots';

    // Dispatch a click event on the link to trigger the download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
  

  
  return (
    <div className="App">
      <div className={`expand-bar ${isExpanded ? 'expanded' : ''}`}>
        <button onClick={toggleExpand}>
          {isExpanded ? 'Hide Panel' : 'Read More'}
        </button>
        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
              <div style={{ textAlign: 'left' }}>
                This is a visualization application for the mango generative design framework for wireframe DNA origami by researchers from the <a href="https://www.andrew.cmu.edu/user/bex/pages/welcome" target="_blank"><b>Microsystems and Mechanobiology Laboratory</b></a> and the <a href="https://www.cmu.edu/me/idig/" target="_blank"><b>Integrated Design Innovation Group</b></a> at <b style={{ color: '#E0E0E0' }}>Carnegie Mellon University</b> in Pittsburgh, Pennsylvania.
              </div>
              <br />

              <div style={{ textAlign: 'left' }}>
                <b>How to use:</b> <br />
                You may drag and drop a created plots file created via the mango generative design package. Alternatively, you may select a sample output from below to view the visualization capabilities of this application.
                <br />
                <br />
                <b>Sample Outputs:</b> <br />
                <a onClick={() => {
                  setIsExpanded(!isExpanded);
                  loadExampleFile('SampleSingleObjective.plots');
                }}> Single Objective Optimization</a>
                <br />
                <a onClick={() => {
                  setIsExpanded(!isExpanded);
                  loadExampleFile('SampleMultiObjective.plots');
                }}> Multiobjective Optimization</a>
              </div>
            </div>
            
            {/*
            <div style={{ marginTop: 'auto', marginBottom: '-180px' }}>
              <p>
                <b>Citation and Links:</b> <br />
                If you use mango or these images in your work, we kindly ask that you cite us via: <br></br>
                (ADD CITATION INFO) <br></br>
              </p>
            </div>
              */}

            <div style={{ marginTop: 'auto', marginBottom: '45px' }}>
              <p>
                {/*<b>Funding and Contact:</b> <br />
                This work was funded by the NSF under grant award CMMI-2113301. <br />
                <br />
                */}
                <input
                  type="checkbox"
                  checked={rememberExpand}
                  onChange={toggleRememberExpand}
                />
                <label>Show bar upon open</label>
                
              </p>
              <div style={{ fontSize: '12px', marginBottom: '10px', color: 'rgba(169,169,169,0.5)'}}>Viewer build {curVersion} </div>
            </div>
          </div>
        )}

      </div>

      {!fileReadSuccessfully && (
        <FileInput onFileChange={handleFileChange} />
      )}

      {windowObjects.map((obj, index) => (
        <WindowObject
          key={index}
          title={obj.title}
          closeable={obj.closeable}
          description={obj.description}
          onClose={() => handleWindowClose(obj.title)}
          showGraphSettingsBar={obj.showGraphSettingsBar}
          plotData={obj.plotData}
          graphType={obj.graphType}
          onClick={handleWindowObjectClick}
          position_x={obj.position_x}
          position_y={obj.position_y}
          vizData={obj.vizData}
          createNewWindowObject={createNewWindowObject}
          onUpdatePlotLayout={handleUpdatePlotLayout}
          onUpdatePlotData={handleUpdatePlotTrace}
          updatePosition={handleUpdatePosition}
          windowObjectSize={obj.metadata}
          onChange={() => false}
        />
      ))}



      {fileReadSuccessfully && showDeleteButton && (
        <div className="delete-button-container">
          <button onClick={handleDeleteFile}>Upload new file</button>
          <span style={{ marginRight: '20px' }}></span>
          {/*<button onClick={handleSavePlots}>Save .plots file </button>*/}
        </div>
      )}
      
    </div>
  )
}

export default App
