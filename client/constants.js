import * as authActions from './constants/authActions';
import * as collectionActions from './constants/collectionsActions';
import * as errorActions from './constants/errorActions';
import * as fileActions from './constants/fileActions';
import * as projectActions from './constants/projectActions';
import * as miscActions from './constants/miscActions';
import * as sketchActions from './constants/sketchActions';
import * as statePersistenceActions from './constants/statePersistenceActions';
import * as uiActions from './constants/uiActions';
import * as userPreferencesActions from './constants/userPreferencesActions';

const ActionTypes = {
  ...authActions,
  ...collectionActions,
  ...errorActions,
  ...fileActions,
  ...projectActions,
  ...miscActions,
  ...sketchActions,
  ...statePersistenceActions,
  ...uiActions,
  ...userPreferencesActions
};

export default ActionTypes;
