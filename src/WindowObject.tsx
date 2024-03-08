import React, { useRef, useMemo, useState, useEffect } from 'react';
import './WindowObject.css';
import { render } from 'react-dom';
import PlottingObject from './PlottingObjects';

interface WindowObjectProps {
  title: string;
  closeable: boolean;
  description: string;
  onClose: () => void;
  showGraphSettingsBar?: boolean;
  plotData: any;
  graphType: string;
  onClick: () => number; // Add onClick prop
  position_x: number;
  position_y: number;
  vizData: any;
  createNewWindowObject: (xy: string, data: any) => void;
  onUpdatePlotLayout: (updatedLayout: any, identifier: string) => void;
  onUpdatePlotData: (updatedData: any, identifier: string) => void;
  updatePosition: (title: string, x: number, y: number) => void; // Function to update position
  windowObjectSize: [number, number];
}

const WindowObject: React.FC<WindowObjectProps> = ({ title, closeable, description, onClose, showGraphSettingsBar, plotData, graphType, onClick, position_x, position_y, vizData, createNewWindowObject, onUpdatePlotLayout, onUpdatePlotData, updatePosition, windowObjectSize}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  // const [position, setPosition] = useState({ x: (window.innerWidth - 300) / 2, y: (window.innerHeight - 200) / 2 });
  const [position, setPosition] = useState({ x: position_x, y: position_y});
  const [activeTab, setActiveTab] = useState('View Output');
  const [showTooltip, setShowTooltip] = useState(false);
  const windowContentRef = useRef<HTMLDivElement>(null);

  // Determine init window size:
  const minWidth = 525; // Set the minimum width
  const maxWidth = 1200; // Set the maximum width
  const minHeight = 400; // Set the minimum height
  const maxHeight = 900; // Set the maximum height
  let useWidth = minWidth;
  let useHeight = minHeight;
  
  if (windowObjectSize && windowObjectSize.length === 2) { 
    if (windowObjectSize[0] > minWidth && windowObjectSize[0] < maxWidth) {
      useWidth = windowObjectSize[0];
    }
    if (windowObjectSize[1] > minHeight && windowObjectSize[1] < maxHeight) {
      useHeight = windowObjectSize[0];
    }
  }

  const [zIndex, setZIndex] = useState(1);
  const [size, setSize] = useState({ width: useWidth, height: useHeight });
  const [windowContentWidth, setWindowContentWidth] = useState(521);
  const [windowContentHeight, setWindowContentHeight] = useState(318);
  const [showTooltip2, setShowTooltip2] = useState(false);
  const [tooltipContent2, setTooltipContent2] = useState('');
  const [tooltipPosition2, setTooltipPosition2] = useState({ x: 0, y: 0 });

  // READ IN PLOT DATA AS JSON AT TOP TO USE LATER:
  let actualPlotData = {
    data: [],
    layout: {},
  };  // Set defautl value to a blank plotly figure
  try {
    actualPlotData = JSON.parse(plotData);
  } catch (error) {
    // Handle the error by just setting actualPlotData to plotData. This is useful for when passing in the problem definition block!
    actualPlotData = plotData;
  }

  const plotOverview = plotData;


  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    const startX = event.clientX - position.x;
    const startY = event.clientY - position.y;
    const handleDrag = (e: MouseEvent) => {
      const maxX = window.innerWidth - size.width; // Maximum X position
      const maxY = window.innerHeight - size.height; // Maximum Y position
      const newX = Math.min(maxX, Math.max(0, e.clientX - startX)); // Calculate new X position
      const newY = Math.min(maxY, Math.max(0, e.clientY - startY)); // Calculate new Y position
      setPosition({ x: newX, y: newY }); // Update position
    };
    const handleDragEnd = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
  };
  

  const handleResizeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResizing(true);
    const startX = event.clientX; // Initial X coordinate of the mouse pointer
    const startY = event.clientY; // Initial Y coordinate of the mouse pointer
    const handleResize = (e: MouseEvent) => {
      const newWidth = size.width + (e.clientX - startX);
      const newHeight = size.height + (e.clientY - startY);

      // Ensure new width is within min and max limits
      const width = Math.max(minWidth, Math.min(maxWidth, newWidth));
      // Ensure new height is within min and max limits
      const height = Math.max(minHeight, Math.min(maxHeight, newHeight));
      setWindowContentHeight(height-82)  // NOTE: THESE VALUES OF 82 AND 4 MATTER. IF YOU CHANGE CSS STYLES YOU'LL NEED TO RECALC THESE
      setWindowContentWidth(width-4)
      updatePosition(title, width, height); // NEED to update this to store whatever is WindowObject width and hegiht which i then use to read in
      setSize({ width, height });
      // Update tooltip content and show it
      setTooltipContent2(`${width} x ${height}`);
      setShowTooltip2(true);
      setTooltipPosition2({ x: e.clientX, y: e.clientY });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
      setShowTooltip2(false);
    };
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', handleResizeEnd);
  };
  

  const handleClose = () => {
    // Handle close functionality here
    onClose();
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleHelpMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleHelpMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const handleClick = () => {
    // Set the z-index of the clicked WindowObject to a higher value
    const newZIndex = onClick();
    // Use the value from onClick to update zIndex:
    setZIndex(newZIndex);
  };

  // Define a function to handle the updated plot data
  const handleUpdatedPlotLayout = (updatedPlotLayout: any) => {
    // Update plotData to confer to the new udpatedPlotLayout
    actualPlotData.layout = updatedPlotLayout;
    onUpdatePlotLayout(actualPlotData.layout, title) // Passback to App.tsx to update the plotData
  };

  function arePlotsEqual(curPlot: any, updatedPlot: any): boolean {    
    // This function very simply checks for equivalent plots so I am updating the correct traces. Note that I am
    // really just checking x y z values, and for some plots this logic may break? We should consider this in the 
    // future.
    //console.log(curPlot);
    //console.log(updatedPlot);
    if (curPlot.x.length !== updatedPlot.x.length || curPlot.y.length !== updatedPlot.y.length) {
      return false;
    }

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

  const handleUpdatedPlotData = (updatedPlotData: any) => {
    // Update plotData to confer to the new udpatedPlotLayout
    // Need to loop over actualPlotData.data and find where updatedPlotData is..
    let plotIdx = -1;
    for (let i = 0; i < actualPlotData.data.length; i++) {
      const value = (actualPlotData.data as any[])[i];
      if (arePlotsEqual(value, updatedPlotData)) {
        (actualPlotData.data as any[])[i] = updatedPlotData;
        plotIdx = i;  // Just checking rn.
      }
    }
    //actualPlotData.data = updatedPlotData;
    
    //onUpdatePlotData(actualPlotData.data, title) // Passback to App.tsx to update the plotData
    onUpdatePlotData(updatedPlotData, title)
  };

  const handleContentClick = (event: any) => {
    event.stopPropagation();
  };


  // Function to render text based on graphType
  const renderSettingsMenuInWindow = () => {
    return <PlottingObject graphType={graphType} plotData={actualPlotData} activeTab={activeTab} plotWidth={windowContentWidth} plotHeight={windowContentHeight} onUpdatePlotLayout={handleUpdatedPlotLayout} onUpdatePlotData={handleUpdatedPlotData} plotOverview={plotOverview} vizData={vizData} createNewWindowObject={createNewWindowObject} title={title}/>
  };

  const renderPlotInWindow = () => {
    return <PlottingObject graphType={graphType} plotData={actualPlotData} activeTab={activeTab} plotWidth={windowContentWidth} plotHeight={windowContentHeight} onUpdatePlotLayout={handleUpdatedPlotLayout} onUpdatePlotData={handleUpdatedPlotData} plotOverview={plotOverview} vizData={vizData} createNewWindowObject={createNewWindowObject} title={title}/>
  };

  // Memoize the renderPlotInWindow function
  const memoizedRenderPlotInWindow = useMemo(() => {
    return <PlottingObject graphType={graphType} plotData={actualPlotData} activeTab={activeTab} plotWidth={windowContentWidth} plotHeight={windowContentHeight} onUpdatePlotLayout={handleUpdatedPlotLayout} onUpdatePlotData={handleUpdatedPlotData} plotOverview={plotOverview} vizData={vizData} createNewWindowObject={createNewWindowObject} title={title}/>
  }, [graphType, actualPlotData, activeTab, windowContentWidth, windowContentHeight, handleUpdatedPlotLayout, onUpdatePlotData, plotOverview]);

  
  return (
    <div
      className={`window-object ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isMinimized ? 'minimized' : ''}`}
      style={{ left: position.x, top: position.y, width: size.width, height: size.height, zIndex: zIndex }}
      onClick={handleClick}
    >
      <div className={`title-bar ${isMinimized ? 'minimized' : ''}`} onMouseDown={handleMouseDown} >
        <div className="title">{title}</div>
        <div className="window-controls">
          <button className="minimize-button" onClick={handleMinimize}>
          {isMinimized ? '+' : '-'}
          </button>

          <button
            className="help-button"
            onMouseEnter={handleHelpMouseEnter}
            onMouseLeave={handleHelpMouseLeave}
          >
            ?
          </button>

          {closeable && (
            <button className="close-button" onClick={handleClose}>
              &times;
            </button>
          )}
        </div>
      </div>

      { !isMinimized && showGraphSettingsBar && (
  <>
    <div className="graph-settings-bar">
      <div className={`tab ${activeTab === 'View Output' ? 'active' : ''}`} onClick={() => handleTabClick('View Output')}>View Output</div>
      <div className={`tab ${activeTab === 'Settings' ? 'active' : ''}`} onClick={() => handleTabClick('Settings')}>Settings</div>
    </div>
    <div className="window-content" onClick={handleContentClick}>
      {activeTab === 'View Output' && memoizedRenderPlotInWindow}
      {activeTab === 'Settings' && renderSettingsMenuInWindow()}
    </div>
  </>
)}

      {!isMinimized && !showGraphSettingsBar && ( // Conditional for the problem definition block:
        <div className="window-content" onClick={handleContentClick}>
            {renderPlotInWindow()}
        </div>
      )}

      {!isMinimized && (
        <div className="resize-handle" onMouseDown={handleResizeMouseDown}></div>
      )}
      {showTooltip2 && (
      <div
        style={{
          position: 'fixed',
          left: `${tooltipPosition2.x + 10}px`, // Offset by 10px for visibility
          top: `${tooltipPosition2.y + 10}px`,
          pointerEvents: 'none', // Prevents the tooltip from interfering with mouse events
        }}
        className="resize-tooltip"
      >
        {tooltipContent2}
      </div>
    )}

      


      {showTooltip && (
        <div className="tooltip">{description}</div>
      )}
      
    </div>
  );
};

export default WindowObject;
