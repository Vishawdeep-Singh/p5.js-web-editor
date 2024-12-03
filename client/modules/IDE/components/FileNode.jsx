import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as IDEActions from '../actions/ide';
import * as FileActions from '../actions/files';
import parseFileName from '../utils/parseFileName';
import DownArrowIcon from '../../../images/down-filled-triangle.svg';
import FolderRightIcon from '../../../images/triangle-arrow-right.svg';
import FolderDownIcon from '../../../images/triangle-arrow-down.svg';
import FileTypeIcon from './FileTypeIcon';

function FileName({ name }) {
  const {
    baseName,
    firstLetter,
    lastLetter,
    middleText,
    extension
  } = parseFileName(name);
  return (
    <span className="sidebar__file-item-name-text">
      <span>{firstLetter}</span>
      {baseName.length > 2 && (
        <span className="sidebar__file-item-name--ellipsis">{middleText}</span>
      )}
      {baseName.length > 1 && <span>{lastLetter}</span>}
      {extension && <span>{extension}</span>}
    </span>
  );
}

FileName.propTypes = {
  name: PropTypes.string.isRequired
};

const FileNode = ({ id, canEdit, onClickFile }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const fileNode =
    useSelector((state) => state.files.find((file) => file.id === id)) || {};
  const authenticated = useSelector((state) => state.user.authenticated);

  const {
    name = '',
    parentId = null,
    children = [],
    fileType = 'file',
    isSelectedFile = false,
    isFolderClosed = false
  } = fileNode;

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatedName, setUpdatedName] = useState(name);

  const fileNameInput = useRef(null);
  const fileOptionsRef = useRef(null);

  const handleFileClick = (event) => {
    event.stopPropagation();
    if (name !== 'root' && !isDeleting) {
      dispatch(IDEActions.setSelectedFile(id));
    }
    if (onClickFile) {
      onClickFile();
    }
  };

  const handleFileNameChange = (event) => {
    setUpdatedName(event.target.value);
  };

  const showEditFileName = () => {
    setIsEditingName(true);
  };

  const hideFileOptions = () => {
    setIsOptionsOpen(false);
  };

  const handleClickRename = () => {
    setUpdatedName(name);
    showEditFileName();
    setTimeout(() => fileNameInput.current.focus(), 0);
    setTimeout(() => hideFileOptions(), 0);
  };

  const handleClickAddFile = () => {
    dispatch(IDEActions.newFile(id));
    setTimeout(() => hideFileOptions(), 0);
  };

  const handleClickAddFolder = () => {
    dispatch(IDEActions.newFolder(id));
    setTimeout(() => hideFileOptions(), 0);
  };

  const handleClickUploadFile = () => {
    dispatch(IDEActions.openUploadFileModal(id));
    setTimeout(hideFileOptions, 0);
  };

  const handleClickDelete = () => {
    const prompt = t('Common.DeleteConfirmation', { name });

    if (window.confirm(prompt)) {
      setIsDeleting(true);
      dispatch(IDEActions.resetSelectedFile(id));
      setTimeout(() => dispatch(FileActions.deleteFile(id, parentId), 100));
    }
  };

  const hideEditFileName = () => {
    setIsEditingName(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      hideEditFileName();
    }
  };

  const saveUpdatedFileName = () => {
    if (updatedName !== name) {
      dispatch(FileActions.updateFileName(id, updatedName));
    }
  };

  const validateFileName = () => {
    const currentName = name;
    const oldFileExtension = currentName.match(/\.[0-9a-z]+$/i);
    const newFileExtension = updatedName.match(/\.[0-9a-z]+$/i);
    const hasPeriod = updatedName.match(/\.+/);
    const hasNoExtension = oldFileExtension && !newFileExtension;
    const hasExtensionIfFolder = fileType === 'folder' && hasPeriod;
    const notSameExtension =
      oldFileExtension &&
      newFileExtension &&
      oldFileExtension[0].toLowerCase() !== newFileExtension[0].toLowerCase();
    const hasEmptyFilename = updatedName.trim() === '';
    const hasOnlyExtension =
      newFileExtension && updatedName.trim() === newFileExtension[0];
    if (
      hasEmptyFilename ||
      hasNoExtension ||
      hasOnlyExtension ||
      hasExtensionIfFolder
    ) {
      setUpdatedName(currentName);
    } else if (notSameExtension) {
      const userResponse = window.confirm(
        'Are you sure you want to change the file extension?'
      );
      if (userResponse) {
        saveUpdatedFileName();
      } else {
        setUpdatedName(currentName);
      }
    } else {
      saveUpdatedFileName();
    }
  };

  const handleFileNameBlur = () => {
    validateFileName();
    hideEditFileName();
  };

  const toggleFileOptions = (event) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }
    setIsOptionsOpen(!isOptionsOpen);
  };

  const itemClass = classNames({
    'sidebar__root-item': name === 'root',
    'sidebar__file-item': name !== 'root',
    'sidebar__file-item--selected': isSelectedFile,
    'sidebar__file-item--open': isOptionsOpen,
    'sidebar__file-item--editing': isEditingName,
    'sidebar__file-item--closed': isFolderClosed
  });

  const isFile = fileType === 'file';
  const isFolder = fileType === 'folder';
  const isRoot = name === 'root';

  const { extension } = parseFileName(name);

  return (
    <div className={itemClass}>
      {!isRoot && (
        <div className="file-item__content" onContextMenu={toggleFileOptions}>
          <span className="file-item__spacer"></span>
          {isFile && (
            <span className="sidebar__file-item-icon">
              <FileTypeIcon
                fileExtension={extension}
                focusable="false"
                aria-hidden="true"
              />
            </span>
          )}
          {isFolder && (
            <div className="sidebar__file-item--folder">
              <button
                className="sidebar__file-item-closed"
                onClick={() => dispatch(FileActions.showFolderChildren(id))}
                aria-label={t('FileNode.OpenFolderARIA')}
                title={t('FileNode.OpenFolderARIA')}
              >
                <FolderRightIcon
                  className="folder-right"
                  focusable="false"
                  aria-hidden="true"
                />
              </button>
              <button
                className="sidebar__file-item-open"
                onClick={() => dispatch(FileActions.hideFolderChildren(id))}
                aria-label={t('FileNode.CloseFolderARIA')}
                title={t('FileNode.CloseFolderARIA')}
              >
                <FolderDownIcon
                  className="folder-down"
                  focusable="false"
                  aria-hidden="true"
                />
              </button>
            </div>
          )}
          <button
            aria-label={updatedName}
            className="sidebar__file-item-name"
            onClick={handleFileClick}
            data-testid="file-name"
          >
            <FileName name={updatedName} />
          </button>
          <input
            data-testid="input"
            type="text"
            className="sidebar__file-item-input"
            value={updatedName}
            maxLength="128"
            onChange={handleFileNameChange}
            ref={fileNameInput}
            onBlur={handleFileNameBlur}
            onKeyPress={handleKeyPress}
          />
          <button
            className="sidebar__file-item-show-options"
            aria-label={t('FileNode.ToggleFileOptionsARIA')}
            ref={fileOptionsRef}
            tabIndex="0"
            onClick={toggleFileOptions}
          >
            <DownArrowIcon focusable="false" aria-hidden="true" />
          </button>
          <div className="sidebar__file-item-options">
            <ul title="file options">
              {isFolder && (
                <>
                  <li>
                    <button
                      aria-label={t('FileNode.AddFolderARIA')}
                      onClick={handleClickAddFolder}
                      className="sidebar__file-item-option"
                    >
                      {t('FileNode.AddFolder')}
                    </button>
                  </li>
                  <li>
                    <button
                      aria-label={t('FileNode.AddFileARIA')}
                      onClick={handleClickAddFile}
                      className="sidebar__file-item-option"
                    >
                      {t('FileNode.AddFile')}
                    </button>
                  </li>
                  {authenticated && (
                    <li>
                      <button
                        aria-label={t('FileNode.UploadFileARIA')}
                        onClick={handleClickUploadFile}
                      >
                        {t('FileNode.UploadFile')}
                      </button>
                    </li>
                  )}
                </>
              )}
              <li>
                <button
                  onClick={handleClickRename}
                  className="sidebar__file-item-option"
                >
                  {t('FileNode.Rename')}
                </button>
              </li>
              <li>
                <button
                  onClick={handleClickDelete}
                  className="sidebar__file-item-option"
                >
                  {t('FileNode.Delete')}
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
      {children && (
        <ul className="file-item__children">
          {children.map((childId) => (
            <li key={childId}>
              <FileNode
                id={childId}
                parentId={id}
                canEdit={canEdit}
                onClickFile={onClickFile}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

FileNode.propTypes = {
  id: PropTypes.string.isRequired,
  canEdit: PropTypes.bool.isRequired,
  onClickFile: PropTypes.func
};

FileNode.defaultProps = {
  onClickFile: null
};

export default FileNode;
