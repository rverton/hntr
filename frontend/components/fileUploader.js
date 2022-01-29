import React from 'react';

const FileUploader = ({ handleFile, children, accept }) => {
  const hiddenFileInput = React.useRef(null);

  const handleClick = () => {
    hiddenFileInput.current.click();
  }

  const handleChange = event => {
    const fileUploaded = event.target.files[0];
    handleFile(fileUploaded);
  }

  return (
    <>
      <button onClick={handleClick}>
        {children}
      </button>
      <input
        type="file"
        accept={accept}
        ref={hiddenFileInput}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </>
  );
}

export default FileUploader;
