import apiClient from '../../../utils/apiClient';
import ActionTypes from '../../../constants';
import { startLoader, stopLoader } from '../reducers/loading';

// eslint-disable-next-line
export function getProjects(username) {
  return (dispatch) => {
    dispatch(startLoader());
    let url;
    if (username) {
      url = `/${username}/projects`;
    } else {
      url = '/projects';
    }
    return apiClient
      .get(url)
      .then((response) => {
        dispatch({
          type: ActionTypes.SET_PROJECTS,
          projects: response.data
        });
        dispatch(stopLoader());
      })
      .catch((error) => {
        dispatch({
          type: ActionTypes.ERROR,
          error: error?.response?.data
        });
        dispatch(stopLoader());
      });
  };
}
