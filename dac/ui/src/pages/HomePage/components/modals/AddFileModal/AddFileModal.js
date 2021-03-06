/*
 * Copyright (C) 2017 Dremio Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, PropTypes } from 'react';
import Modal from 'components/Modals/Modal';
import { connect } from 'react-redux';
import { destroy } from 'redux-form';
import Immutable from 'immutable';

import { denormalizeFile } from 'selectors/resources';

import {
  uploadFileToPath,
  loadFilePreview,
  uploadFinish,
  uploadCancel,
  resetFileFormatPreview
} from 'actions/modals/addFileModal';

import ApiUtils from 'utils/apiUtils/apiUtils';
import { getHomeContents } from 'selectors/datasets';
import { getViewState } from 'selectors/resources';
import { getEntityType } from 'utils/pathUtils';
import { resetViewState } from 'actions/resources';

import AddFileFormPage1 from './AddFileFormPage1';
import FileFormatForm from './../../../components/forms/FileFormatForm';

const VIEW_ID = 'AddFileModal';
const PREVIEW_VIEW_ID = 'AddFileModalPreview';

class AddFileModal extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    hide: PropTypes.func,

    //connected

    parentEntity: PropTypes.instanceOf(Immutable.Map),
    viewState: PropTypes.instanceOf(Immutable.Map),
    previewViewState: PropTypes.instanceOf(Immutable.Map),
    fileName: PropTypes.string,
    file: PropTypes.instanceOf(Immutable.Map),
    uploadFileToPath: PropTypes.func,
    loadFilePreview: PropTypes.func.isRequired,
    uploadFinish: PropTypes.func.isRequired,
    uploadCancel: PropTypes.func.isRequired,
    destroy: PropTypes.func.isRequired,
    resetViewState: PropTypes.func.isRequired,
    resetFileFormatPreview: PropTypes.func
  };

  static contextTypes = {username: PropTypes.string};

  constructor(props) {
    super(props);
    this.state = { page: 0 };
  }

  componentWillMount() {
    this.success = false;
    this.props.resetViewState(VIEW_ID);
    this.props.resetViewState(PREVIEW_VIEW_ID);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.fileName // fileName is undefined after success
      && nextProps.fileName !== this.props.fileName) {
      this.cancelUpload();
    }
  }

  onHide = (success) => {
    this.setState({ page: 0 });
    if (!success) {
      this.cancelUpload();
    }
    this.props.destroy('addFile');
    this.props.resetViewState(VIEW_ID);
    this.props.resetViewState(PREVIEW_VIEW_ID);
    this.props.hide();
  }

  onSubmitFile = (values) => {
    const { parentEntity } = this.props;
    const { file, name, extension } = values;
    this.props.resetFileFormatPreview()
      .then(() => this.props.uploadFileToPath(parentEntity, file, { name }, extension, VIEW_ID))
      .then((response) => {
        if (response.error) {
          // if we have an error, do nothing as the ViewStateWrapper will show the error to the user for us.
          return;
        }

        this.goToPage(1);
      });
  }

  onSubmitFormat = (values) => {
    const { file } = this.props;
    return ApiUtils.attachFormSubmitHandlers(
      this.props.uploadFinish(file, values, PREVIEW_VIEW_ID)
    ).then(() => {
      this.onHide(true);
    });
  }

  onPreview = (values) => {
    const { file } = this.props;
    this.props.loadFilePreview(file, values, PREVIEW_VIEW_ID);
  }

  cancelUpload() {
    const { file } = this.props;
    if (file) {
      this.props.uploadCancel(file);
    }
  }

  goToPage = (pageNumber) => {
    this.setState({ page: pageNumber });
    if (pageNumber === 1) {
      this.props.resetViewState(VIEW_ID);
    } else {
      this.props.resetViewState(PREVIEW_VIEW_ID);
    }
  }

  render() {
    const { file, isOpen, viewState, previewViewState } = this.props;
    const { page } = this.state;
    const pageSettings = [{
      title: la('Add File: Browse for File (Step 1 of 2)'),
      size: 'small'
    }, {
      title: la('Add File: Set Format (Step 2 of 2)'),
      size: 'large'
    }];
    return (
      <Modal
        size={pageSettings[page].size}
        title={pageSettings[page].title}
        isOpen={isOpen}
        hide={this.onHide}>
        {page === 0 &&
          <AddFileFormPage1
            ref='form'
            onFormSubmit={this.onSubmitFile}
            onCancel={this.onHide}
            viewState={viewState}
          />
        }
        {page === 1 &&
          <FileFormatForm
            file={file}
            onFormSubmit={this.onSubmitFormat}
            onCancel={this.goToPage.bind(this, 0)}
            cancelText='Back'
            onPreview={this.onPreview}
            viewState={viewState}
            previewViewState={previewViewState}
          />
        }
      </Modal>
    );
  }
}

function mapStateToProps(state) {
  const parentType = getEntityType(location.pathname);
  const parentEntity = getHomeContents(state, parentType, window.location.pathname) || Immutable.Map();
  const fileName = state.form.addFile && state.form.addFile.name ? state.form.addFile.name.value : undefined;
  let file;
  if (parentEntity && fileName) {
    const fileUrlPath = parentEntity.getIn(['links', 'file_prefix']) + '/' + encodeURIComponent(fileName);
    file = denormalizeFile(state, fileUrlPath);
  }
  return {
    parentEntity,
    viewState: getViewState(state, VIEW_ID),
    previewViewState: getViewState(state, PREVIEW_VIEW_ID),
    fileName,
    file
  };
}

export default connect(mapStateToProps, {
  uploadFileToPath,
  loadFilePreview,
  uploadFinish,
  uploadCancel,
  destroy,
  resetViewState,
  resetFileFormatPreview
})(AddFileModal);
