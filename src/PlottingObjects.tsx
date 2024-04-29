// PlottingObject.tsx
import PlotEditor from './PlotEditor';
import React, { useMemo, useState, useEffect} from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-dist';
import './PlottingObjects.css';
import { update } from 'plotly.js';
import { debounce } from 'lodash';

interface PlottingObjectProps {
  graphType: string;
  plotOverview: any;
  plotData: any;
  activeTab: string; // Assuming you have a prop for activeTab
  plotWidth: number;
  plotHeight: number;
  vizData: any;
  onUpdatePlotLayout: (updatedPlotLayout: any) => void; // Callback function to handle updated plot data
  onUpdatePlotData: (updatedPlotData: any) => void;
  createNewWindowObject: (xy: string, data: any) => void;
  title: string;
  editMode: boolean;
}



const PlottingObject: React.FC<PlottingObjectProps> = React.memo(({ graphType, plotData, activeTab, plotWidth, plotHeight, onUpdatePlotLayout, onUpdatePlotData, plotOverview, vizData, createNewWindowObject, title, editMode }) => {
    // Add the scatterData to the top so we can access in different areas:
    const [layout, setLayout] = useState(plotData.layout);
    const [showPlotEditor, setShowPlotEditor] = useState(false);
    const [editorPosition, setEditorPosition] = useState({ x: 0, y: 0 });
    const [currentPopUp, setCurrentPopUp] = useState(null); 


    const exportImage = (svg_or_png: string) => {
        layout.height = plotHeight;
        layout.width = plotWidth;
        layout.uirevision = 'true',
        layout.paper_bgcolor = "rgba(255, 255, 255, 0)"

        const tempDiv = document.createElement('div');
        Plotly.newPlot(tempDiv, plotData, layout);
        try {
            // Download the plot as SVG
            Plotly.downloadImage(tempDiv, { format: svg_or_png, width: plotWidth, height: plotHeight, filename: title });
        } catch (error) {
            console.error('Error exporting plot to SVG:', error);
        } 
    };

    // Function to render the settings menu based on graphType
    const renderSettingsMenu = () => {
        if (activeTab === 'Settings') {
            // Logic to render settings menu based on graphType
            return (
                <div className="settings-menu">
                    <div className="export-buttons">
                        <button onClick={() => exportImage('svg')}>Export to SVG</button>
                        <span style={{ marginRight: '20px' }}></span>
                        <button onClick={() => exportImage('png')}>Export to PNG</button>
                    </div>
                    <div>
                        <br></br>
                        WIP: Need to add some general plot editing features here (e.g. axis titles) that a user can click on otherwise via plotly
                    </div>
                    {/*<div className="settings-table">
                        <table>
                            <thead>
                                <tr>
                                    <th colSpan={2}>General Options</th>
                                    <th colSpan={2}>Plot Options</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Dummy Field 1</td>
                                    <td>Dummy Field 2</td>
                                    <td>Dummy Field 3</td>
                                    <td>Dummy Field 4</td>
                                </tr>
                                <tr>
                                <td>Dummy Field 1</td>
                                    <td>
                                        <select>
                                            <option>Option 1</option>
                                            <option>Option 2</option>
                                            <option>Option 3</option>
                                        </select>
                                    </td>
                                <td>Dummy Field 3</td>
                                    <td>
                                        <select>
                                            <option>Option 1</option>
                                            <option>Option 2</option>
                                            <option>Option 3</option>
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                <td>Dummy Field 2</td>
                                <td>
                                    <select>
                                        <option>Option 1</option>
                                        <option>Option 2</option>
                                        <option>Option 3</option>
                                    </select>
                                </td>
                                <td>Dummy Field 4</td>
                                <td>
                                    <select>
                                        <option>Option 1</option>
                                        <option>Option 2</option>
                                        <option>Option 3</option>
                                    </select>
                                </td>
                            </tr>

                            </tbody>
                        </table>
                    </div>*/}
                </div>
            );
        } else {
            return null;  // Null will tell react to render "nothing" if the settingMenu is not active!
        }
    };

    // Function to render the Problem Definition:
    const renderDefinition = () => {
        // Render objective
        const objective = <p><b>Objective:</b> <span className="objective">Minimize {plotOverview.objective_name}</span></p>;
    
        // Render constraints
        try {
            const constraints = Object.keys(plotOverview)
            .filter(key => key !== 'objective_name')
            .map((key, index) => {
                if (typeof plotOverview[key] === 'object' && !Array.isArray(plotOverview[key])) {
                    // Handle nested object separately
                    const nestedEntries = Object.entries(plotOverview[key])
                        .filter(([nestedKey]) => nestedKey !== 'objective_constants')
                        .map(([nestedKey, nestedValue]: [string, any]) => {
                            return (
                                <tr key={nestedKey}>
                                    <td style={{ borderRight: '2px solid black', borderTop: '2px solid black', padding: '5px' }}>{nestedKey}</td>
                                    <td style={{ padding: '5px', borderTop: '2px solid black' }}>{nestedValue}</td>
                                </tr>
                            );
                        });
                    return nestedEntries;
                } else if (key !== 'objective_constants') { // Filter out keys like 'objective_constants'
                    let valueText;
                    if (Array.isArray(plotOverview[key]) && plotOverview[key].length === 2) {
                        valueText = `${plotOverview[key][0]} ≤ x ≤ ${plotOverview[key][1]}`;
                    } 
                    else if (typeof key === 'string') {
                        
                        if (key.includes("max")) {
                            valueText = `x ≤ ${plotOverview[key]}`;
                        } else if (key.includes("min")) {
                            valueText = `x ≥ ${plotOverview[key]}`;
                        } else {
                            valueText = plotOverview[key];
                        }
                    } else {
                        valueText = plotOverview[key];
                    }
                    return (
                        <tr key={key} style={{ borderBottom: '2px solid black', borderTop: '2px solid black' }}>
                            <td style={{ borderRight: '2px solid black', padding: '5px', textAlign: 'center' }}>{key}</td>
                            <td style={{ padding: '5px', textAlign: 'center' }}>{valueText}</td>
                        </tr>
                    );
                }
                return null; // Return null for keys like 'objective_constants'
            })
            .filter(constraint => constraint !== null);
                return (
                    <div>
                        {objective}
                        <div className="constraints" style={{ textAlign: 'center' }}>
                            <p><b>Subject To:</b></p>
                            <table style={{ borderCollapse: 'collapse', borderSpacing: '0', margin: 'auto' }}>
                                <tbody>
                                    {constraints}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

        } catch (error) {
            // Handle the error here
            console.error("Error occurred:", error);
        }
    };


    const handleClose = (updatedPopUp: any) => {
        // Update your state or perform actions with the updatedPopUp data here
        setShowPlotEditor(false); // Close the editor
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
    }

    const handleChange = (updatedPlot: any, fieldChange: string) => {
        let comparisonString = 'legendgroup'
        let meshChange = false;
        if (fieldChange === 'mesh') {
            comparisonString = 'type'
            fieldChange = 'color'  // Switch value of fieldChange for cheaky way to update all mesh3d traces
        } 
        if (fieldChange === 'fullmesh') {
            comparisonString = 'type'
            fieldChange = 'color'
            meshChange = true;
        }
        let updates = [];
        for (const key of Object.keys(plotData['data'])) {
            const value = plotData['data'][key];
            // How to check if value is defined (i.e. to make sure it is not undefined / is a type I can check "in")
            //if (value && typeof value === 'object' && comparisonString in value && comparisonString in updatedPlot) {
            if (arePlotsEqual(value, updatedPlot) && meshChange === false) {
                /*if ('type' in value && value.type === 'mesh3d') {
                    const updatedValue = { ...value, [fieldChange]: updatedPlot[fieldChange] };
                    updates.push(updatedValue)
                } I think this was a brain fart... dont know why those ifs are like that.*/
                // Update value:
                const updatedValue = { ...value, [fieldChange]: updatedPlot[fieldChange] };
                updates.push(updatedValue)
                
            } else if (meshChange) {
                // If meshChange is true then we must push ALL mesh3d objects related objects to have this new color:
                // I currently just dont use a legendgroup for the mesh elements i need to plot so this works fine for now
                // In the future, I may see a bug pop up because of this really bad logic :)
                if ('type' in value && value.type === 'mesh3d' ) {
                    const updatedValue = { ...value, [fieldChange]: updatedPlot[fieldChange] };
                    updates.push(updatedValue)
                } 
            }
        }
        updates.forEach(update => onUpdatePlotData(update));
    };
    
    const render_plotly_data = () => {
        layout.height = plotHeight;
        layout.uirevision = 'true',
        layout.width = plotWidth;
        const config = { displayModeBar: false, scrollZoom: true, };

        const handleSelectedPoints = (event: any) => {
            let showEditor = true;
            if (showPlotEditor === true) {
                setShowPlotEditor(false);
            }
            if ('points' in event && 'legendgroup' in event.points[0].data) {
                if (event.points[0].data.legendgroup == 'animation') {
                    showEditor = false;
                }
            }
            // We only populate an update if the "Event" timer is included since we only "pop up" 3D windows.
            const selectedPoints = event.points; // Extract selected data points
            const popUp = selectedPoints[0];
            const windowX =  window.scrollX;
            const windowY =  window.scrollY;
            
            // TODO: Add a "Edit Mode" checkbox to the Settings bar
            if (showEditor === true ) {

                // If in edit mode we show the editor:
                if (editMode === true) {
                    setEditorPosition({ x: windowX, y: windowY }); // Set position for the editor
                    setCurrentPopUp(popUp['data']); // Pass the selected popUp data to the editor
                    setShowPlotEditor(true); // Show the editor
                } else {
                    // Call another plotting function here if needed (check if in Visualized, if yes plot 3D Scatter)
                    const pointAsString = `(${selectedPoints[0].x}, ${selectedPoints[0].y})`;
                    
                    if (Object.keys(vizData).length === 1) {
                        const pointPlotMap= Object.values(vizData)[0] as Record<string, any>;
                        // Now we check if this x, y (point as string) is in the viz map:
                        if (pointAsString in pointPlotMap) {
                            const jsonDataToPlot = pointPlotMap[pointAsString];
                            // Need to create a new WindowObject at App.tsx.... how can I do this???
                            createNewWindowObject(pointAsString, jsonDataToPlot)
                        }
                        
                    } else {
                        // WIP: When I incorporate better three.js and can "relax" the visualization a bit, I will then need
                        //      to figure out how to map one WindowObject to a specific part of vizData.
                    }

                }
                
            }
            
        };
        if ('frames' in plotData) {
            return <Plot data={plotData.data} layout={layout} frames={plotData.frames} config={config} onRelayout={handleRelayout} onClick={handleSelectedPoints}/>
        } else {
            return <Plot data={plotData.data} layout={layout} config={config} onRelayout={handleRelayout} onClick={handleSelectedPoints}/>
        }
        
    };

    const handleRelayout = debounce((event: Plotly.PlotRelayoutEvent) => {
        const updatedLayout = { ...plotData.layout };
        // Check if xaxis.range is present in the event object
        if (event['xaxis.range[0]'] !== undefined && event['xaxis.range[1]'] !== undefined) {
            updatedLayout.xaxis.range = [event['xaxis.range[0]'], event['xaxis.range[1]']];
        }
        if (event['yaxis.range[0]'] !== undefined && event['yaxis.range[1]'] !== undefined) {
            updatedLayout.yaxis.range = [event['yaxis.range[0]'], event['yaxis.range[1]']];
        }
        
        // Check if the 3D window is the event change:
        if ('scene.camera' in event) {
            updatedLayout.scene.camera = event['scene.camera']
        }

        onUpdatePlotLayout(updatedLayout);  // Pass back the updatedLayout to update the plotData
        setLayout(updatedLayout);
      }, 100);
                   

    // Function to render the plot based on graphType and plotData
    const renderPlot = () => {
        // Logic to render plot based on graphType and plotData
        if (activeTab === 'View Output') {
            if (graphType === '2D_Scatter' || graphType === 'scatter') {
                // return "2D Scatter Plot Call";
                return render_plotly_data()
            } else if (graphType === '3D_Scatter' || graphType === 'scatter3d') {
                //return "3D Scatter Plot Call";
                return render_plotly_data()
            } else if (graphType === 'bar') {
                return "Bar chart Call";
            } else if (graphType === '3D_Animation') {
                return "Animation Call";
            } else if (graphType === 'None') {
                return renderDefinition()
            } else {
                return `ERROR: Unsupported graphType passed in, please validate the value of ${graphType} in your entry file`;
            }
        } else {
            return null;
        }
    };

    useEffect(() => {
        if (!showPlotEditor) {
            setCurrentPopUp(null); // Reset currentPopUp when hiding the editor
        }
    }, [showPlotEditor]);

    return (
        <div className="plot-container" >
            {renderSettingsMenu()}
            {renderPlot()}
            {showPlotEditor && (
                    <PlotEditor
                        position={editorPosition}
                        plotData={currentPopUp}
                        onClose={handleClose}
                        onChange={handleChange}
                    />
                )}
        </div>
    );
});

export default PlottingObject;
