export const NAME_METHOD = {
  // AuthService
  LOGIN: 'login',
  GENERATE_TOKEN: 'generateToken',

  // UserService
  FIND_BY_ID: 'findById',
  FIND_BY_EMAIL: 'findByEmail',
  GET_ALL_USERS: 'getAllUsers',
  GET_USER_BY_ID: 'getUserById',
  CREATE_USER: 'createUser',
  UPDATE_USER: 'updateUser',
  DELETE_USER: 'deleteUser',

  // PayrollService
  GET_PAYROLLS_FOR_USER: 'getPayrollsForUser',
  CREATE_PAYROLL: 'createPayroll',

  // RoleService
  FIND_ROLE_BY_ID: 'findById',
  FIND_BY_NAME: 'findByName',
  GET_ALL_ROLES: 'getAllRoles',
  CREATE_ROLE: 'createRole',
  UPDATE_ROLE: 'updateRole',
  DELETE_ROLE: 'deleteRole',

  // ABACService
  FILTER_RESOURCE_BY_ROLE: 'filterResourceByRole',
  FILTER_SINGLE_RESOURCE_BY_ROLE: 'filterSingleResourceByRole',
  CAN_ACCESS_ATTRIBUTE: 'canAccessAttribute',
  CAN_MODIFY_ATTRIBUTE: 'canModifyAttribute',
  CREATE_RESOURCE: 'createResource',
  CREATE_ATTRIBUTE: 'createAttribute',
  CREATE_ROLE_PERMISSION: 'createRolePermission',
  GET_RESOURCES: 'getResources',
  GET_ATTRIBUTES_BY_RESOURCE: 'getAttributesByResource',
  GET_ROLE_PERMISSIONS: 'getRolePermissions',

  // Controllers
  LOGIN_CONTROLLER: 'login',
  GET_ALL_USERS_CONTROLLER: 'getAllUsers',
  GET_USER_BY_ID_CONTROLLER: 'getUserById',
  CREATE_USER_CONTROLLER: 'createUser',
  UPDATE_USER_CONTROLLER: 'updateUser',
  DELETE_USER_CONTROLLER: 'deleteUser',
  GET_MY_PROFILE_CONTROLLER: 'getMyProfile',
  GET_ALL_ROLES_CONTROLLER: 'getAllRoles',
  GET_ROLE_BY_ID_CONTROLLER: 'getRoleById',
  GET_ROLE_BY_NAME_CONTROLLER: 'getRoleByName',
  CREATE_ROLE_CONTROLLER: 'createRole',
  UPDATE_ROLE_CONTROLLER: 'updateRole',
  DELETE_ROLE_CONTROLLER: 'deleteRole',
  GET_PAYROLLS_CONTROLLER: 'getPayrolls',
  CREATE_PAYROLL_CONTROLLER: 'createPayroll',

  // Guards
  CAN_ACTIVATE: 'canActivate',
  EXTRACT_TOKEN_FROM_HEADER: 'extractTokenFromHeader',

  // Interceptors
  INTERCEPT: 'intercept',
  FILTER_RESPONSE_BY_ROLE: 'filterResponseByRole',
  GET_RESOURCE_FROM_PATH: 'getResourceFromPath',

  // Repositories
  FIND_BY_ID_REPO: 'findById',
  FIND_BY_EMAIL_REPO: 'findByEmail',
  FIND_ALL_REPO: 'findAll',
  SAVE_REPO: 'save',
  DELETE_REPO: 'delete',
  FIND_BY_USER_ID_REPO: 'findByUserId',
  FIND_BY_NAME_REPO: 'findByName',
  GET_ROLE_PERMISSIONS_BY_RESOURCE_REPO: 'getRolePermissionsByResource',
  GET_ROLE_PERMISSION_BY_ATTRIBUTE_REPO: 'getRolePermissionByAttribute',
  GET_ROLE_PERMISSIONS_REPO: 'getRolePermissions',
  CREATE_RESOURCE_REPO: 'createResource',
  GET_RESOURCES_REPO: 'getResources',
  GET_RESOURCE_BY_NAME_REPO: 'getResourceByName',
  CREATE_ATTRIBUTE_REPO: 'createAttribute',
  GET_ATTRIBUTES_BY_RESOURCE_REPO: 'getAttributesByResource',
  GET_ATTRIBUTE_BY_RESOURCE_AND_FIELD_REPO: 'getAttributeByResourceAndField',
  CREATE_ROLE_PERMISSION_REPO: 'createRolePermission',
  UPDATE_ROLE_PERMISSION_REPO: 'updateRolePermission',
  DELETE_ROLE_PERMISSION_REPO: 'deleteRolePermission'
};
