import React, { useState } from 'react';
import './PlotEditor.css'; // Import the CSS file
import ColorPicker from './ColorPicker';

// Define the props expected by PlotEditor
interface PlotEditorProps {
    position: { x: number; y: number };
    plotData: any; // Assuming 'any' for now, but you should replace it with a more specific type based on your data structure
    onClose: (updatedPlotData: any) => void; // Callback to pass updated data back
    onChange: (updatedPlotData: any, fieldChange: string) => void; // Callback to pass updated data back
}

const PlotEditor: React.FC<PlotEditorProps> = ({ position, plotData, onClose, onChange }) => {
    const [localPlotData, setlocalPlotData] = useState(plotData);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [isMarkerOutlineChecked, setIsMarkerOutlineChecked] = useState(localPlotData['marker'] && 'line' in localPlotData['marker']);


    // Function to handle saving changes and closing the editor
    const handleSave = () => {
        onClose(localPlotData); // Pass the updated plotData data back to the parent component
    };

    const updateLayout = (updatedPlotData: any, fieldChange: string) => {
        onChange(updatedPlotData, fieldChange);
    }


    // Function to handle change in "show in legend" checkbox
    const handleChangeShowLegend = (e: React.ChangeEvent<HTMLInputElement>) => {
        setlocalPlotData({ ...localPlotData, showlegend: e.target.checked });
        updateLayout({ ...localPlotData, showlegend: e.target.checked }, 'showlegend');
    };

    const handleLineChange = (property: string, value: any) => {
        const updatedLine = { ...localPlotData['line'], [property]: value };
        const updatedPlotData = { ...localPlotData, line: updatedLine };
        setlocalPlotData(updatedPlotData);
        updateLayout(updatedPlotData, 'line');
    };

    const handleMarkerChange = (property: string, value: any) => {
        const updatedMarker = { ...localPlotData['marker'], [property]: value };
        const updatedPlotData = { ...localPlotData, marker: updatedMarker };
        setlocalPlotData(updatedPlotData);
        updateLayout(updatedPlotData, 'marker');
    };

    const handleMarkerOutlineView = (property: string, value: any, turnOff: boolean ) => {
        if (turnOff) {
            const updatedMarker = { ...localPlotData['marker'] };
            delete updatedMarker['line'];
            const updatedPlotData = { ...localPlotData, marker: updatedMarker };
            setlocalPlotData(updatedPlotData);
            updateLayout(updatedPlotData, 'marker');
        } else {
            const updatedMarker = { ...localPlotData['marker'] };
            updatedMarker[property] = value;
            const updatedPlotData = { ...localPlotData, marker: updatedMarker };
            setlocalPlotData(updatedPlotData);
            updateLayout(updatedPlotData, 'marker');

        } 
    };

    const handleMarkerOutlineChange = (property: string, value: any) => {
        const updatedMarker = { ...localPlotData['marker'] };
        updatedMarker['line'][property] = value;
        const updatedPlotData = { ...localPlotData, marker: updatedMarker };
        setlocalPlotData(updatedPlotData);
        updateLayout(updatedPlotData, 'marker');
    };

    // Define a function to handle changes to the checkbox
    const handleMarkerOutlineCheckedChange = (e: any) => {
        const isChecked = e.target.checked;

        if (isChecked) {
            // If the checkbox is checked, show the additional fields
            setIsMarkerOutlineChecked(true);
            const newEntry = { color: 'black', width: 2 };
            handleMarkerOutlineView('line', newEntry, false);
        } else {
            // If the checkbox is unchecked, hide the additional fields
            setIsMarkerOutlineChecked(false);
            const newEntry = 'hide';
            handleMarkerOutlineView('line', newEntry, true);
        }
    };
    


    function rgbToHex(rgb: string) {
        // Split the RGB string into its individual components
        const rgbArray = rgb.match(/\d+/g);
        if (!rgbArray || rgbArray.length !== 3) {
            // Invalid RGB string
            return '#000000';
        }
    
        // Convert each component to its hexadecimal equivalent
        const hexArray = rgbArray.map(component => {
            const hex = parseInt(component).toString(16); // Convert to hexadecimal
            return hex.length === 1 ? "0" + hex : hex; // Pad with zero if necessary
        });
    
        // Construct the hexadecimal color string
        return "#" + hexArray.join("");
    }

    

    const ColorSelector = ({ type }: { type: string }) => {
        let colorValue: string | undefined; // Define a variable to hold the color value

        // Check the type and set the color value accordingly
        if (type === 'line' || type === 'marker') {
            colorValue = rgbToHex(localPlotData[type]['color']);
        } else if (type === 'outline') {
            // Handle 'outline' type
            colorValue = '#000000'
        }


        return (
            <div>
                    <input
                    type="color"
                    value={colorValue}
                    onChange={(e) => {
                        setSelectedColor(e.target.value);
                        if (type == 'line') {
                            handleLineChange('color', e.target.value);
                        } if (type == 'marker') {
                            handleMarkerChange('color', e.target.value);
                        } if (type == 'outline') {
                            handleMarkerOutlineChange('color', e.target.value);
                        }
                        
                    }}
                    className="editor-input"
                    />
                    <select onChange={(e) => {
                        setSelectedColor(e.target.value);
                        if (type == 'line') {
                            handleLineChange('color', e.target.value);
                        } if (type == 'marker') {
                            handleMarkerChange('color', e.target.value);
                        } if (type == 'outline') {
                            handleMarkerOutlineChange('color', e.target.value);
                        }
                    }}>
                        <option value="">Color Presets</option>
                        <option value="#88CCEE" style={{ color: '#88CCEE', height: '20px', width: '20px' }}>Cyan</option>
                        <option value="#44AA99" style={{ color: '#44AA99', height: '20px', width: '20px' }}>Teal</option>
                        <option value="#117733" style={{ color: '#117733', height: '20px', width: '20px' }}>Green</option>
                        <option value="#999933" style={{ color: '#999933', height: '20px', width: '20px' }}>Olive</option>
                        <option value="#DDCC77" style={{ color: '#DDCC77', height: '20px', width: '20px' }}>Sand</option>
                        <option value="#CC6677" style={{ color: '#CC6677', height: '20px', width: '20px' }}>Rose</option>
                        <option value="#882255" style={{ color: '#882255', height: '20px', width: '20px' }}>Wine</option>
                        <option value="#AA4499" style={{ color: '#AA4499', height: '20px', width: '20px' }}>Purple</option>
                    </select>
                </div>
        )
    };

    const LineEditor = () => {
        return (
            <div className="line-editor">
                <ColorSelector type="line"/>
                <br></br>
                <label className="editor-label">Dashes:</label>
                <select
                    value={localPlotData['line']['dash']}
                    onChange={(e) => handleLineChange('dash', e.target.value)}
                    className="editor-input"
                >
                    <option value="solid">solid</option>
                    <option value="dash">dash</option>
                    <option value="dot">dot</option>
                    <option value="longdash">long dash</option>
                    <option value="dashdot">dash dot</option>
                    <option value="longdashdot">long dash dot</option>
                </select>
                <br></br>
                <label className="editor-label">Line Width:</label>
                <input
                    type="number"
                    value={localPlotData['line']['width']}
                    min="0.25"
                    max="10"
                    step="0.25"
                    onChange={(e) => handleLineChange('width', parseFloat(e.target.value))}
                    className="editor-input"
                />
            </div>)
    };


    const MarkerOutline = () => {
        return (
            <div className="marker-editor">
                <ColorSelector type="outline"/>
                <label className="editor-label">Outline Width:</label>
                <input
                    type="number"
                    value={localPlotData['marker']['line']['width']}
                    min="0.25"
                    max="5"
                    step="0.25"
                    onChange={(e) => handleMarkerOutlineChange('width', parseFloat(e.target.value))}
                    className="editor-input"
                />
                <br></br>
            </div>)
    };


    const MarkerEditor = () => {
        if ('line' in localPlotData['marker']) {

        }
        return (
            <div className="marker-editor">
                <ColorSelector type="marker"/>
                <br></br>
                <label className="editor-label">Symbol:</label>
                <select
                    value={localPlotData['marker']['symbol']}
                    onChange={(e) => handleMarkerChange('symbol', e.target.value)}
                    className="editor-input"
                >
                    <option value="circle">circle</option>
                    <option value="square">square</option>
                    <option value="diamond">diamond</option>
                    <option value="x">x</option>
                </select>
                <br></br>
                <label className="editor-label">Size:</label>
                <input
                    type="number"
                    value={localPlotData['marker']['size']}
                    min="2"
                    max="18"
                    step="1"
                    onChange={(e) => handleMarkerChange('size', parseFloat(e.target.value))}
                    className="editor-input"
                />
                <br></br>
                <div className="show-legend-container">
                    <label>
                        <input
                            type="checkbox"
                            checked={isMarkerOutlineChecked}
                            onChange={handleMarkerOutlineCheckedChange}
                        />
                        Outline Symbol?
                        {/* Call function to render MarkerOutline Changes*/}
                    </label> <br></br>
                    {isMarkerOutlineChecked && (
                        // Additional fields to render when the checkbox is checked
                        <div>
                            {/* Additional fields go here */}
                            <MarkerOutline />
                        </div>
                    )}
                </div>
                
            </div>)
    };

    // Function to render different editor blocks based on plot mode
    const renderEditorBlockScatter = () => {
        switch (localPlotData['mode']) {
            case 'lines':
                return <LineEditor />;
            case 'markers':
                return <MarkerEditor />
            case 'lines+markers':
            case 'markers+lines':
                return ( <div>
                    <LineEditor />
                    <MarkerEditor />
                </div>)
            default:
                return null;
        }
    };

    const renderPlotData = () => {
        if (localPlotData['type'] === 'scatter') {
            return renderEditorBlockScatter();
        } else {
            return (
                <div className="plot-data-container">
                    {/* Render data for other plot types */}
                    <p>This plotly chart type is not yet supported for this UI!</p>
                </div>
            );
        }
    };


    // Inline styles for positioning and styling the editor
    const editorStyles = {
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: '250px',
        height: '400px',
        borderRadius: '10px',
        border: '3px solid rgb(164, 164, 164)',
        position: 'absolute' as 'absolute', // TypeScript requires casting for "absolute" here
        backgroundColor: '#fff',
        boxShadow: '0px 0px 30px rgba(0,0,0,0.5)',
        padding: '10px',
        boxSizing: 'border-box' as 'border-box', // Ensure padding doesn't affect the overall dimensions
        display: 'flex',
        flexDirection: 'column' as 'column', // Ensure the content is laid out vertically
        wordwrap: 'break-word' /* Or overflow-wrap: break-word; */
    };
    

    return (
        <div className="plot-editor" style={editorStyles}>
            <button className="plot-editor-button" onClick={handleSave}>Close</button>
            {/* Content of the editor goes here. For demonstration, a simple save button is added. */}
            <div className="legendgroup-container">
                <label>Currently Editing:</label>
                {localPlotData.legendgroup ? localPlotData.legendgroup : "No provided trace name"}
            </div>
            <div className="show-legend-container">
                <label>
                    <input
                        type="checkbox"
                        checked={localPlotData.showlegend}
                        onChange={handleChangeShowLegend}
                    />
                    Show in Legend?
                </label>
            </div>

            {renderPlotData()}
        </div>
    );
};

export default PlotEditor;
