// PlottingObject.tsx
import PlotEditor from './PlotEditor';
import React, { useMemo, useState, useEffect} from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-dist';
import './PlottingObjects.css';
import { update } from 'plotly.js';

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
}



const PlottingObject: React.FC<PlottingObjectProps> = React.memo(({ graphType, plotData, activeTab, plotWidth, plotHeight, onUpdatePlotLayout, onUpdatePlotData, plotOverview, vizData, createNewWindowObject, title }) => {
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
            //return "Add in: Export (SVG PNG), Change paper_color, font_style, axis titles, axis_colors, axis_fontsize, grid, hide / show option, etc."
            return (
                <div className="settings-menu">
                    <div className="export-buttons">
                        <button onClick={() => exportImage('svg')}>Export to SVG</button>
                        <span style={{ marginRight: '20px' }}></span>
                        <button onClick={() => exportImage('png')}>Export to PNG</button>
                    </div>
                    <div className="settings-table">
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
                    </div>
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
            }

    const handleClose = (updatedPopUp: any) => {
        // Update your state or perform actions with the updatedPopUp data here
        setShowPlotEditor(false); // Close the editor
    };

    const handleChange = (updatedPlot: any, fieldChange: string) => {
        console.log(updatedPlot)
        console.log(fieldChange)
        let comparisonString = 'legendgroup'
        let meshChange = false;
        if (fieldChange === 'mesh') {
            comparisonString = 'type'
            fieldChange = 'color'  // Switch value of fieldChange for cheaky way to update all mesh3d traces
            meshChange = true;
        } 
        let updates = [];
        for (const key of Object.keys(plotData['data'])) {
            const value = plotData['data'][key];
            console.log(value)
            // How to check if value is defined (i.e. to make sure it is not undefined / is a type I can check "in")
            if (value && typeof value === 'object' && comparisonString in value && comparisonString in updatedPlot) {
                if (value[comparisonString] === updatedPlot[comparisonString]) {
                    // Perform some action specific to 'indicator'
                    // (put this back if below fails) value[fieldChange] = updatedPlot[fieldChange];
                    const updatedValue = { ...value, [fieldChange]: updatedPlot[fieldChange] };
                    updates.push(updatedValue)
                    // (put this back if above fails) onUpdatePlotData(value)

                    if (meshChange === false) {
                        break; // Exit the loop after performing the action if not performing a mesh color change.
                    }
                }
            } 
        }
        updates.forEach(update => onUpdatePlotData(update));
    };
    
    const render_plotly_data = () => {
        layout.height = plotHeight;
        layout.uirevision = 'true',
        layout.width = plotWidth;
        const config = { displayModeBar: false };

        const handleSelectedPoints = (event: any) => {
            if (showPlotEditor === true) {
                setShowPlotEditor(false);
            }
            // We only populate an update if the "Event" timer is included since we only "pop up" 3D windows.
            const selectedPoints = event.points; // Extract selected data points
            const popUp = selectedPoints[0];
            const windowX =  window.scrollX;
            const windowY =  window.scrollY;
            setEditorPosition({ x: windowX, y: windowY }); // Set position for the editor
            setCurrentPopUp(popUp['data']); // Pass the selected popUp data to the editor
            setShowPlotEditor(true); // Show the editor

            const x = selectedPoints[0].x;
            const y = selectedPoints[0].y;
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
        };
        return <Plot data={plotData.data} layout={layout} config={config} onRelayout={handleRelayout} onClick={handleSelectedPoints}/>

    };

    const handleRelayout = (event: Plotly.PlotRelayoutEvent) => {
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
      };
                   

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
