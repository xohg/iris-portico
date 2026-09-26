/**
 * Typed, domain-grouped helpers for the 6 required Management Portal task areas.
 *
 * Each group wraps the relevant /api/admin endpoints with generated types.
 * This is the layer the frontend screens call. The generic `client.get/post/...`
 * remains available for any of the 276 operations not wrapped here.
 */
import type { AdminClient } from './AdminClient';
import type {
  Info,
  // web apps
  WebApplicationList,
  Application,
  WebAppPctAccess,
  WebSessionList,
  DocDBApplicationList,
  DocDBApplication,
  NamespaceList,
  Namespace,
  // permissions
  UserList,
  User,
  RoleList,
  Role,
  RoleOwnerList,
  ResourceList,
  Resource,
  ServiceList,
  Service,
  PrivilegedRoutineApplicationList,
  SQLPrivilegeList,
  SQLColumnPrivilegeList,
  WebAuthenticationSettings,
  // security / secrets
  WalletCollectionList,
  WalletCollection,
  WalletSecretList,
  WalletSecret,
  X509CredentialsList,
  X509Credential,
  X509CredentialCertificate,
  SSLConfigurationList,
  SSLConfig,
  OAuth2ServerDefinition,
  OAuth2ServerConfiguration,
  OAuth2ServerClientList,
  OAuth2ServerClient,
  OAuth2ResourceServerList,
  OAuth2ResourceServer,
  OAuth2ResourceServerMappingList,
  MFTConnectionList,
  MFTConnection,
  LDAPConfigurationList,
  LDAPConfig,
  EncryptionSettings,
  SuperserverList,
  Superserver,
  // tasks
  TaskList,
  Task,
  TaskExtraInfo,
  TaskHistory,
  UpcomingTasks,
  AsyncTaskList,
  AsyncTask,
  // system
  ProcessList,
  Process,
  DeviceList,
  Device,
  DeviceSubTypeList,
  DeviceSettings,
  SystemUsageStats,
  SharedMemoryUsage,
  MainDashboardStats,
  SystemResourcesStats,
  LicenseUsage,
  LockList,
  LocalDatabaseList,
  LocalDatabase,
  VolumeFile,
  IntegrityCheckRequest,
  ConfigDatabaseList,
  ConfigDatabase,
  // logs
  JournalFileList,
  JournalFile,
  JournalRecord,
  JournalSettings,
  AuditEventList,
  AuditEvent,
  AuditRecord,
  AuditingEnabled,
  // encryption keys
  EncryptionKeyList,
  DataElementKeyList,
  EncryptionFileAdminList,
  EncryptionFileKeyList,
  // ecp
  ECPSettings,
  ECPDataServerList,
  ECPDataServer,
  ECPClientList,
  ECPSSLConnectionList,
  // external language servers
  LanguageServerList,
  LanguageServer,
  LanguageServerActivity,
  // filesystem access purposes
  FSAccessPurposeList,
  FSAccessPurpose,
  FSAccessPathList,
  // wqm
  WQMCategory,
  WQMCategoryList,
} from '../types';

type Q = Record<string, unknown>;

export interface Domains {
  general: {
    info(): Promise<Info>;
  };
  webApps: {
    list(): Promise<WebApplicationList>;
    get(name: string): Promise<Application>;
    create(name: string, body: Partial<Application>): Promise<Application>;
    update(name: string, body: Partial<Application>): Promise<Application>;
    remove(name: string): Promise<void>;
    listPctAccess(name: string): Promise<WebAppPctAccess[]>;
    /** DANGEROUS: DELETE /v2/web-app?name. */
    removeApp(name: string): Promise<void>;
    /** GET /v2/web-app/pct-access — `name`+`allowType`+`class` are required query params. */
    getPctAccess(name: string, allowType: string, className: string): Promise<WebAppPctAccess>;
    /** PUT /v2/web-app/pct-access — `name`+`allowType`+`class` required query params; body carries the access fields. */
    upsertPctAccess(name: string, allowType: string, className: string, body: Record<string, unknown>): Promise<WebAppPctAccess>;
    /** DELETE /v2/web-app/pct-access — `name`+`allowType`+`class` required query params. */
    removePctAccess(name: string, allowType: string, className: string): Promise<void>;
    listSessions(): Promise<WebSessionList>;
    removeSession(id: string): Promise<void>;
    listDocDbs(): Promise<DocDBApplicationList>;
    getDocDb(name: string, ns: string): Promise<DocDBApplication>;
    listNamespaces(): Promise<NamespaceList>;
    getNamespace(name: string): Promise<Namespace>;
  };
  permissions: {
    listUsers(): Promise<UserList>;
    getUser(name: string): Promise<User>;
    createUser(name: string, body: Partial<User>): Promise<User>;
    updateUser(name: string, body: Partial<User>): Promise<User>;
    removeUser(name: string): Promise<void>;
    changePassword(name: string, body: { password: string }): Promise<void>;
    listRoles(): Promise<RoleList>;
    getRole(name: string): Promise<Role>;
    createRole(name: string, body: Partial<Role>): Promise<Role>;
    updateRole(name: string, body: Partial<Role>): Promise<Role>;
    removeRole(name: string): Promise<void>;
    getRoleOwners(name: string): Promise<RoleOwnerList>;
    listResources(): Promise<ResourceList>;
    getResource(name: string): Promise<Resource>;
    listServices(): Promise<ServiceList>;
    getService(name: string): Promise<Service>;
    listPrivilegedRoutines(): Promise<PrivilegedRoutineApplicationList>;
    listSQLPrivileges(q?: Q): Promise<SQLPrivilegeList>;
    grantSQLPrivilege(q: Q): Promise<void>;
    revokeSQLPrivilege(q: Q): Promise<void>;
    listSQLColumnPrivileges(q?: Q): Promise<SQLColumnPrivilegeList>;
    getWebAuth(): Promise<WebAuthenticationSettings>;
    setWebAuth(body: Partial<WebAuthenticationSettings>): Promise<WebAuthenticationSettings>;
  };
  security: {
    // wallet
    listWalletCollections(): Promise<WalletCollectionList>;
    getWalletCollection(name: string): Promise<WalletCollection>;
    createWalletCollection(name: string, body: Partial<WalletCollection>): Promise<WalletCollection>;
    updateWalletCollection(name: string, body: Partial<WalletCollection>): Promise<WalletCollection>;
    removeWalletCollection(name: string): Promise<void>;
    listWalletSecrets(name: string): Promise<WalletSecretList>;
    createWalletSecret(name: string, body: Partial<WalletSecret>): Promise<WalletSecret>;
    removeWalletSecret(name: string): Promise<void>;
    // x509
    listX509Credentials(): Promise<X509CredentialsList>;
    getX509Credential(alias: string): Promise<X509Credential>;
    createX509Credential(alias: string, body: Partial<X509Credential>): Promise<X509Credential>;
    updateX509Credential(alias: string, body: Partial<X509Credential>): Promise<X509Credential>;
    removeX509Credential(alias: string): Promise<void>;
    getX509Certificate(alias: string): Promise<X509CredentialCertificate>;
    // oauth2
    listOAuth2ServerDefinitions(): Promise<OAuth2ServerDefinition[]>;
    getOAuth2ServerDefinition(id: string): Promise<OAuth2ServerDefinition>;
    createOAuth2ServerDefinition(body: Partial<OAuth2ServerDefinition>): Promise<OAuth2ServerDefinition>;
    removeOAuth2ServerDefinition(id: string): Promise<void>;
    getOAuth2ServerConfig(): Promise<OAuth2ServerConfiguration>;
    listOAuth2Clients(): Promise<OAuth2ServerClientList>;
    getOAuth2Client(id: string): Promise<OAuth2ServerClient>;
    createOAuth2Client(body: Partial<OAuth2ServerClient>): Promise<OAuth2ServerClient>;
    removeOAuth2Client(id: string): Promise<void>;
    changeOAuth2ClientSecret(id: string, body: { secret: string }): Promise<void>;
    listOAuth2ResourceServers(): Promise<OAuth2ResourceServerList>;
    getOAuth2ResourceServer(name: string): Promise<OAuth2ResourceServer>;
    createOAuth2ResourceServer(name: string, body: Partial<OAuth2ResourceServer>): Promise<OAuth2ResourceServer>;
    updateOAuth2ResourceServer(name: string, body: Partial<OAuth2ResourceServer>): Promise<OAuth2ResourceServer>;
    removeOAuth2ResourceServer(name: string): Promise<void>;
    listOAuth2ResourceServerMappings(): Promise<OAuth2ResourceServerMappingList>;
    // ssl
    listSSLConfigurations(): Promise<SSLConfigurationList>;
    getSSLConfiguration(name: string): Promise<SSLConfig>;
    createSSLConfiguration(name: string, body: Partial<SSLConfig>): Promise<SSLConfig>;
    updateSSLConfiguration(name: string, body: Partial<SSLConfig>): Promise<SSLConfig>;
    removeSSLConfiguration(name: string): Promise<void>;
    testSSLConfiguration(name: string): Promise<void>;
    // encryption
    getEncryptionSettings(): Promise<EncryptionSettings>;
    setEncryptionSettings(body: Partial<EncryptionSettings>): Promise<EncryptionSettings>;
    // mft / ldap
    listMFTConnections(): Promise<MFTConnectionList>;
    getMFTConnection(name: string): Promise<MFTConnection>;
    listLDAPConfigurations(): Promise<LDAPConfigurationList>;
    getLDAPConfiguration(name: string): Promise<LDAPConfig>;
    testLDAP(body: { name: string; user: string; password: string }): Promise<void>;
    // superservers
    listSuperservers(): Promise<SuperserverList>;
    getSuperserver(port: number, bindAddress: string): Promise<Superserver>;
    // encryption keys
    listEncryptionKeys(): Promise<EncryptionKeyList>;
    listDataElementKeys(): Promise<DataElementKeyList>;
    getEncryptionFileAdmins(file: string): Promise<EncryptionFileAdminList>;
    getEncryptionFileKeys(file: string): Promise<EncryptionFileKeyList>;
    /** Deactivate a key (`{Action, AdminName, AdminPassword}` required). */
    deactivateEncryptionKey(body: { Action: string; AdminName: string; AdminPassword: string }): Promise<void>;
    // oauth2 (additional)
    getOAuth2ClientConfigurations(serverId: string): Promise<unknown>;
    /** `service` is the query param (NOT `name`). */
    getOAuth2ResourceServerMappings(service: string): Promise<OAuth2ResourceServerMappingList>;
    // filesystem access purposes
    listFsAccessPurposes(): Promise<FSAccessPurposeList>;
    getFsAccessPurpose(purpose: string): Promise<FSAccessPurpose>;
    /** `purpose` is the query param (NOT `name`). */
    listFsAccessPurposePaths(purpose: string): Promise<FSAccessPathList>;
    // encryption keys (write)
    /** POST /v2/security/encryption/file — create a key file. */
    createEncryptionKey(body: { File: string; AdminName: string; AdminPassword: string; KeyLen: string | number; Description?: string }): Promise<void>;
    /** POST /v2/security/encryption/file/activate — activate/deactivate a key. */
    activateEncryptionKey(body: { Action: string; AdminName: string; AdminPassword: string }): Promise<void>;
    /** POST /v2/security/encryption/file/admin — add an admin. */
    addEncryptionFileAdmin(body: { file: string; AdminName: string; AdminPassword: string }): Promise<void>;
    /** DELETE /v2/security/encryption/file/admin?file. */
    removeEncryptionFileAdmin(file: string): Promise<void>;
    /** POST /v2/security/encryption/file/key — add a key to a file. */
    addEncryptionFileKey(body: { file: string }): Promise<void>;
    /** DELETE /v2/security/encryption/file/key?file. */
    removeEncryptionFileKey(file: string): Promise<void>;
    // oauth2 (write)
    /** POST /v2/security/oauth2/server-definition/initial-access-token — body `{serverId}`. */
    initialOAuth2AccessToken(serverId: string): Promise<void>;
    /** PUT /v2/security/oauth2/server-definition — body `serverId` required. */
    updateOAuth2ServerDefinition(serverId: string, body: Record<string, unknown>): Promise<void>;
    /** PUT /v2/security/oauth2/server/client — body `clientId` required. */
    updateOAuth2Client(clientId: string, body: Record<string, unknown>): Promise<void>;
    /** PUT /v2/security/oauth2/server — activate/modify the AS configuration. */
    updateOAuth2ServerConfig(body: Record<string, unknown>): Promise<void>;
    /** DELETE /v2/security/oauth2/server — deactivate the AS. */
    removeOAuth2ServerConfig(): Promise<void>;
    /** POST /v2/security/oauth2/server/password — body `{ServerPassword}`. */
    changeOAuth2ServerPassword(body: { ServerPassword: string }): Promise<void>;
    /** POST /v2/security/oauth2/resource-server/secret — body `{name}`. */
    postOAuth2ResourceServerSecret(name: string): Promise<void>;
    /** GET /v2/security/oauth2/client/client-configuration?applicationName. */
    getOAuth2ClientConfiguration(applicationName: string): Promise<unknown>;
    /** PUT /v2/security/oauth2/client/client-configuration — body `applicationName` required. */
    updateOAuth2ClientConfiguration(applicationName: string, body: Record<string, unknown>): Promise<void>;
    /** DELETE /v2/security/oauth2/client/client-configuration?applicationName. */
    removeOAuth2ClientConfiguration(applicationName: string): Promise<void>;
    /** POST /v2/security/oauth2/client/client-configuration/register-client — body `{applicationName}`. */
    registerOAuth2Client(applicationName: string): Promise<void>;
    /** POST /v2/security/oauth2/client/client-configuration/rotate-keys — body `{applicationName}`. */
    rotateOAuth2ClientKeys(applicationName: string): Promise<void>;
    /** POST /v2/security/oauth2/client/client-configuration/secrets — body `{applicationName}`. */
    createOAuth2ClientSecrets(applicationName: string, body: Record<string, unknown>): Promise<void>;
    /** GET /v2/security/oauth2/resource-server/mapping?key. */
    getOAuth2ResourceServerMapping(key: string): Promise<unknown>;
    /** PUT /v2/security/oauth2/resource-server/mapping — body `key` required. */
    updateOAuth2ResourceServerMapping(key: string, body: Record<string, unknown>): Promise<void>;
    /** DELETE /v2/security/oauth2/resource-server/mapping?key. */
    removeOAuth2ResourceServerMapping(key: string): Promise<void>;
    // mft / ldap (write)
    /** PUT /v2/security/mft/connection?connection — `connection` is a query param. */
    updateMFTConnection(connection: string, body: Record<string, unknown>): Promise<void>;
    /** DELETE /v2/security/mft/connection?connection. */
    removeMFTConnection(connection: string): Promise<void>;
    /** DELETE /v2/security/mft/connection/token?connection. */
    revokeMFTToken(connection: string): Promise<void>;
    /** GET /v2/security/mft/connection/auth-code-url — query `connection`, `scope`, `redirect`. */
    getMFTAuthCodeUrl(connection: string, q: { scope: string; redirect: string }): Promise<unknown>;
    /** PUT /v2/security/ldap/configuration?name — `name` is a query param. */
    updateLDAPConfiguration(name: string, body: Record<string, unknown>): Promise<void>;
    /** DELETE /v2/security/ldap/configuration?name. */
    removeLDAPConfiguration(name: string): Promise<void>;
    /** POST /v2/security/ldap/configuration/search-password — body `{name, Password}`. */
    searchLdapPassword(name: string, body: { name: string; Password: string }): Promise<unknown>;
    /** POST /v2/security/ldap/test — body `{Username, Password}`. */
    testLdapLogin(body: { Username: string; Password: string }): Promise<void>;
    // superservers (write)
    /** PUT /v2/security/superserver — body `port` required. */
    updateSuperserver(port: number, body: Record<string, unknown>): Promise<void>;
    /** DANGEROUS: DELETE /v2/security/superserver?port. */
    removeSuperserver(port: number): Promise<void>;
    // privileged routines (write)
    /** GET /v2/security/privileged-routines — list. */
    listPrivilegedRoutines(): Promise<unknown[]>;
    /** GET /v2/security/privileged-routine?name. */
    getPrivilegedRoutine(name: string): Promise<unknown>;
    /** PUT /v2/security/privileged-routine — body `name` required. */
    updatePrivilegedRoutine(name: string, body: Record<string, unknown>): Promise<void>;
    /** DANGEROUS: DELETE /v2/security/privileged-routine?name. */
    removePrivilegedRoutine(name: string): Promise<void>;
    // resources / services (write)
    /** PUT /v2/security/resource — body `name` required. */
    updateResource(name: string, body: Record<string, unknown>): Promise<void>;
    /** PUT /v2/security/service — body `name` required. */
    updateService(name: string, body: Record<string, unknown>): Promise<void>;
    // sql privileges (read + write; `grantee` required, `namespace` for column/admin)
    /** GET /v2/security/sql-privileges — query `grantee` (+ `namespace`). */
    listSqlPrivileges(q: { grantee: string; namespace?: string }): Promise<unknown[]>;
    /** GET /v2/security/sql-admin-privileges — query `grantee` + `namespace` required. */
    listSqlAdminPrivileges(q: { grantee: string; namespace: string }): Promise<unknown[]>;
    /** GET /v2/security/sql-column-privileges — query `grantee` + `namespace` required. */
    listSqlColumnPrivileges(q: { grantee: string; namespace: string }): Promise<unknown[]>;
    /** POST /v2/security/sql-admin-privilege/grant. */
    grantSqlAdminPrivilege(body: { namespace: string; grantee: string; privilege: string }): Promise<void>;
    /** POST /v2/security/sql-admin-privilege/revoke. */
    revokeSqlAdminPrivilege(body: { namespace: string; grantee: string; privilege: string }): Promise<void>;
    /** POST /v2/security/sql-column-privilege/grant. */
    grantSqlColumnPrivilege(body: { namespace: string; grantee: string; table: string; column: string; privilege: string; action: string }): Promise<void>;
    /** POST /v2/security/sql-column-privilege/revoke. */
    revokeSqlColumnPrivilege(body: { namespace: string; grantee: string; table: string; column: string; privilege: string; action: string }): Promise<void>;
    // audit events (write)
    // All three require 3 query params: `source` (full event name), `type`,
    // `name` (the latter two are not validated by the API but are required).
    /** PUT /v2/security/audit/event?source&type&name — body `{Enabled}`. */
    updateAuditEvent(q: { source: string; type: string; name: string }, body: { Enabled: boolean }): Promise<void>;
    /** DANGEROUS: DELETE /v2/security/audit/event?source&type&name. */
    removeAuditEvent(q: { source: string; type: string; name: string }): Promise<void>;
    /** POST /v2/security/audit/event/clear-count?source&type&name. */
    clearAuditEventCount(q: { source: string; type: string; name: string }): Promise<void>;
    // web-auth (write)
    /** POST /v2/security/web-auth/smtp-password — body `{SMTPPassword}`. */
    changeWebAuthSmtpPassword(body: { SMTPPassword: string }): Promise<void>;
  };
  tasks: {
    list(): Promise<TaskList>;
    get(id: string): Promise<Task>;
    create(id: string, body: Partial<Task>): Promise<Task>;
    update(id: string, body: Partial<Task>): Promise<Task>;
    remove(id: string): Promise<void>;
    run(id: number | string, body?: { RunNow?: boolean; when?: string }): Promise<void>;
    suspend(id: number | string): Promise<void>;
    resume(id: number | string): Promise<void>;
    history(): Promise<TaskHistory[]>;
    upcoming(): Promise<UpcomingTasks>;
    managerStatus(): Promise<unknown>;
    runManager(): Promise<void>;
    suspendManager(): Promise<void>;
    resumeManager(): Promise<void>;
    // async
    listAsync(q?: Q): Promise<AsyncTaskList>;
    getAsync(id: string): Promise<AsyncTask>;
    cancelAsync(id: string): Promise<AsyncTask>;
    pauseAsync(id: string): Promise<AsyncTask>;
    resumeAsync(id: string): Promise<AsyncTask>;
    // Verified shapes (IRIS 2026.2): the detail/info/put/delete param is the numeric `id`.
    getTask(id: string): Promise<Task>;
    getTaskInfo(id: string): Promise<TaskExtraInfo>;
    /** POST /v2/task — body = the task definition (no query params). */
    createTask(body: Partial<Task>): Promise<Task>;
    /** PUT /v2/task — `id` is a BODY field: { id, ...definition }. */
    updateTask(id: string, body: Partial<Task>): Promise<Task>;
    removeTask(id: string): Promise<void>;
  };
  system: {
    listProcesses(): Promise<ProcessList>;
    getProcess(id: number): Promise<Process>;
    suspendProcess(id: number): Promise<void>;
    resumeProcess(id: number): Promise<void>;
    terminateProcess(id: number): Promise<void>;
    /** Send a broadcast message to the given process IDs (`{Message, PidList}`). */
    broadcast(message: string, pidList: number[]): Promise<void>;
    listDevices(): Promise<DeviceList>;
    getDevice(name: string): Promise<Device>;
    listDeviceSubTypes(): Promise<DeviceSubTypeList>;
    getDeviceSettings(): Promise<DeviceSettings>;
    setDeviceSettings(body: Partial<DeviceSettings>): Promise<DeviceSettings>;
    systemUsage(): Promise<SystemUsageStats>;
    sharedMemoryUsage(): Promise<SharedMemoryUsage>;
    mainDashboard(): Promise<MainDashboardStats>;
    systemResources(): Promise<SystemResourcesStats>;
    licenseUsage(): Promise<LicenseUsage>;
    listLocks(): Promise<LockList>;
    listLocalDatabases(): Promise<LocalDatabaseList>;
    getLocalDatabase(dir: string): Promise<LocalDatabase>;
    /**
     * Mutating operations resolve with `{ taskId, data }`. `taskId` is the
     * async task id from the `202 + Location` response (null when the
     * operation answered synchronously); poll `tasks.getAsync(taskId)` to
     * follow the long-running work.
     */
    databaseInfo(dir: string): Promise<{ taskId: string | null; data: unknown }>;
    listVolumes(dir: string): Promise<VolumeFile[]>;
    truncateDatabase(dir: string, targetSizeMb: number): Promise<{ taskId: string | null; data: unknown }>;
    modifySizeDatabase(dir: string, sizeMb: number): Promise<{ taskId: string | null; data: unknown }>;
    expandVolumeDatabase(dir: string, initialSizeMb: number): Promise<{ taskId: string | null; data: unknown }>;
    integrityCheckDatabase(dir: string, body?: IntegrityCheckRequest): Promise<{ taskId: string | null; data: unknown }>;
    createLocalDatabase(dir: string, body: Partial<LocalDatabase> & { Directory: string }): Promise<LocalDatabase>;
    removeLocalDatabase(dir: string): Promise<void>;
    mountDatabase(dir: string): Promise<{ taskId: string | null; data: unknown }>;
    dismountDatabase(dir: string): Promise<{ taskId: string | null; data: unknown }>;
    compactDatabase(dir: string): Promise<{ taskId: string | null; data: unknown }>;
    defragmentDatabase(dir: string): Promise<{ taskId: string | null; data: unknown }>;
    listDatabases(): Promise<ConfigDatabaseList>;
    getDatabase(name: string): Promise<ConfigDatabase>;
    /** GET /v2/device/subtype?name — the 9 setting fields of a device subtype. */
    getDeviceSubtype(name: string): Promise<unknown>;
    /** PUT /v2/device/subtype — body `name` required (verified). */
    upsertDeviceSubtype(body: Record<string, unknown>): Promise<void>;
    /** DELETE /v2/device/subtype?name. */
    removeDeviceSubtype(name: string): Promise<void>;
    /** PUT /v2/device — body `name` required (verified). */
    upsertDevice(body: Record<string, unknown>): Promise<void>;
    /** DANGEROUS: DELETE /v2/device?name. */
    removeDevice(name: string): Promise<void>;
    /** DELETE /v2/lock?id — release a lock. */
    releaseLock(id: number | string): Promise<void>;
  };
  logs: {
    listJournalFiles(): Promise<JournalFileList>;
    getJournalFile(file: string): Promise<JournalFile>;
    /** Async (202 + Location): fire the record-scan task and poll `tasks.getAsync(taskId)`. */
    listJournalRecords(file: string, q?: Q): Promise<{ taskId: string | null; data: unknown }>;
    /** Single record; the query param is `address` (not `record`). */
    getJournalRecord(file: string, address: number): Promise<JournalRecord>;
    getJournalSettings(): Promise<JournalSettings>;
    setJournalSettings(body: Partial<JournalSettings>): Promise<JournalSettings>;
    listAuditEvents(): Promise<AuditEventList>;
    getAuditEvent(source: string, type: string, name: string): Promise<AuditEvent>;
    /** Async (202 + Location): fire the audit-record query and poll `tasks.getAsync(taskId)`. */
    listAuditRecords(q?: Q): Promise<{ taskId: string | null; data: unknown }>;
    isAuditingEnabled(): Promise<AuditingEnabled>;
    setAuditingEnabled(body: { Enabled: boolean }): Promise<AuditingEnabled>;
    /** Purge audit records in [BeginDateTime, EndDateTime] (exact-case body fields). */
    purgeAuditRecords(body: { BeginDateTime: string; EndDateTime: string }): Promise<void>;
    /** Single audit record (exact-case query params). */
    getAuditRecord(utcTimeStamp: string, systemID: string, auditIndex: string): Promise<AuditRecord>;
    /** Async (202 + Location): fire the journal integrity-check task; poll `tasks.getAsync(taskId)`. */
    integrityCheck(file: string): Promise<{ taskId: string | null; data: unknown }>;
    /** POST /v2/journal/switch-dir — no required params (409 when only one directory). */
    switchDir(): Promise<void>;
    /** POST /v2/journal/switch-file — no params, EXECUTES on call (DANGEROUS). */
    switchFile(): Promise<void>;
  };
  /** ECP (External Client Protocol) — settings, data servers, app servers, SSL connections. */
  ecp: {
    getSettings(): Promise<ECPSettings>;
    setSettings(body: Partial<ECPSettings>): Promise<ECPSettings>;
    listDataServers(): Promise<ECPDataServerList>;
    getDataServer(name: string): Promise<ECPDataServer>;
    listDataServerDatabases(name: string): Promise<unknown>;
    listApplicationServers(): Promise<ECPClientList>;
    getApplicationServer(name: string): Promise<unknown>;
    listSslConnections(): Promise<ECPSSLConnectionList>;
    /** 1=disconnect, 2=disable, 3=change to normal. `name` is a query param, `Action` in the body. */
    dataServerAction(name: string, action: 1 | 2 | 3): Promise<void>;
    /** Create or edit a data server (verified: required body field is lowercase `name`). */
    upsertDataServer(body: { name: string; address?: string; port?: string; databases?: string }): Promise<void>;
    /** DANGEROUS: remove a data server (`name` is a query param). */
    removeDataServer(name: string): Promise<void>;
    /** Authorize a pending application-server SSL connection (body `{name}`). */
    authorizeSslConnection(name: string): Promise<void>;
    /** Reject a pending application-server SSL connection (body `{name}`). */
    rejectSslConnection(name: string): Promise<void>;
    /** DANGEROUS: remove an application-server SSL connection (`name` is a query param). */
    removeSslConnection(name: string): Promise<void>;
  };
  /** External language (gateway) servers — list, detail, activity, start/stop. */
  extLang: {
    list(): Promise<LanguageServerList>;
    get(name: string): Promise<LanguageServer>;
    activity(name: string): Promise<LanguageServerActivity>;
    /** `name` is a query param (not a body field). */
    start(name: string): Promise<void>;
    stop(name: string): Promise<void>;
    /** Create/edit a language server. `name` is a required BODY field (spec is broken). */
    upsert(name: string, body: Partial<LanguageServer>): Promise<LanguageServer>;
    /** DANGEROUS: delete a language server. `name` is a query param. */
    remove(name: string): Promise<void>;
  };
  /** Namespaces — list/detail/create/delete + routine/global/package mapping CRUD, copy, interop. */
  namespaces: {
    list(): Promise<NamespaceList>;
    get(name: string): Promise<Namespace>;
    /** PUT /v2/namespace — body `name` required (verified). */
    create(name: string, body: Record<string, unknown>): Promise<void>;
    /** DANGEROUS: DELETE /v2/namespace?name. */
    remove(name: string): Promise<void>;
    /** Query param `namespace` is REQUIRED by the live API; optional here so callers may omit it (degrades to a 400 → []). */
    listRoutineMappings(namespace?: string): Promise<unknown[]>;
    getRoutineMapping(name: string): Promise<unknown>;
    /** PUT /v2/namespace/routine-mapping — body `name` required. */
    createRoutineMapping(name: string, body: Record<string, unknown>): Promise<void>;
    removeRoutineMapping(name: string): Promise<void>;
    listGlobalMappings(namespace?: string): Promise<unknown[]>;
    getGlobalMapping(name: string): Promise<unknown>;
    /** PUT /v2/namespace/global-mapping — body `name` required. */
    createGlobalMapping(name: string, body: Record<string, unknown>): Promise<void>;
    removeGlobalMapping(name: string): Promise<void>;
    listPackageMappings(namespace?: string): Promise<unknown[]>;
    getPackageMapping(name: string): Promise<unknown>;
    /** PUT /v2/namespace/package-mapping — body `name` required. */
    createPackageMapping(name: string, body: Record<string, unknown>): Promise<void>;
    removePackageMapping(name: string): Promise<void>;
    /** POST /v2/namespace/copy-mappings. */
    copyMappings(body: { SourceNamespace: string; DestinationNamespace: string }): Promise<void>;
    /** POST /v2/namespace/enable-interop — body `{name}`. */
    enableInterop(name: string): Promise<void>;
  };
  /** WQM (Work Queue Management) categories — worker pools, limits, queue behaviour. */
  wqm: {
    listCategories(): Promise<WQMCategoryList>;
    /** Query param is `name` (verified). */
    getCategory(name: string): Promise<WQMCategory & { Name?: string }>;
    /** PUT body requires `name` (verified); keep `Name` too so create and edit are both accepted. */
    upsertCategory(name: string, body: Record<string, unknown>): Promise<WQMCategory & { Name?: string }>;
    removeCategory(name: string): Promise<void>;
  };
  /** License — the instance license key and the license servers that distribute keys. */
  license: {
    getKey(): Promise<unknown>;
    validateKey(key: string): Promise<unknown>;
    activateKey(key: string): Promise<void>;
    listServers(): Promise<unknown[]>;
    getServer(name: string): Promise<unknown>;
    upsertServer(name: string, body: Record<string, unknown>): Promise<void>;
    removeServer(name: string): Promise<void>;
  };
  /** Databases — config databases, local directory config edits and Doc-DB applications. */
  databases: {
    /** GET /v2/database?name — config database detail. */
    getDatabase(name: string): Promise<ConfigDatabase>;
    /** PUT /v2/database — create/edit a config database (body `name` required). */
    upsertDatabase(name: string, body: Partial<ConfigDatabase> & { name: string }): Promise<ConfigDatabase>;
    /** DANGEROUS: DELETE /v2/database?name. */
    removeDatabase(name: string): Promise<void>;
    /** PUT /v2/database-dir — edit a local database directory config (body `dir` required). */
    upsertDir(dir: string, body: Partial<LocalDatabase> & { dir: string }): Promise<LocalDatabase>;
    listDocDbs(): Promise<DocDBApplicationList>;
    getDocDb(name: string): Promise<DocDBApplication>;
    /** PUT /v2/doc-db — create/edit a Doc-DB application (body `name` required). */
    upsertDocDb(name: string, body: Partial<DocDBApplication> & { name: string }): Promise<DocDBApplication>;
    removeDocDb(name: string): Promise<void>;
  };
}

export function createDomains(c: AdminClient): Domains {
  return {
    general: {
      info: () => c.getInfo(),
    },
    webApps: {
      list: () => c.get<WebApplicationList>('/v2/web-apps'),
      get: (name) => c.get<Application>('/v2/web-app', { name }),
      // Create-or-update: the v2 API uses PUT (not POST) for /v2/web-app.
      create: (name, body) => c.put<Application>('/v2/web-app', body, { name }),
      update: (name, body) => c.put<Application>('/v2/web-app', body, { name }),
      remove: (name) => c.del<void>('/v2/web-app', { name }),
      listPctAccess: (name) => c.get<WebAppPctAccess[]>('/v2/web-app/pct-accesses', { names: name }),
      removeApp: (name) => c.del<void>('/v2/web-app', { name }),
      getPctAccess: (name, allowType, className) => c.get<WebAppPctAccess>('/v2/web-app/pct-access', { name, allowType, class: className }),
      upsertPctAccess: (name, allowType, className, body) => c.put<WebAppPctAccess>('/v2/web-app/pct-access', body, { name, allowType, class: className }),
      removePctAccess: (name, allowType, className) => c.del<void>('/v2/web-app/pct-access', { name, allowType, class: className }),
      listSessions: () => c.get<WebSessionList>('/v2/web-sessions'),
      removeSession: (id) => c.del<void>('/v2/web-session', { id }),
      listDocDbs: () => c.get<DocDBApplicationList>('/v2/doc-dbs'),
      getDocDb: (name, ns) => c.get<DocDBApplication>('/v2/doc-db', { name, namespace: ns }),
      listNamespaces: () => c.get<NamespaceList>('/v2/namespaces'),
      getNamespace: (name) => c.get<Namespace>('/v2/namespace', { name }),
    },
    permissions: {
      listUsers: () => c.get<UserList>('/v2/security/users'),
      getUser: (name) => c.get<User>('/v2/security/user', { name }),
      createUser: (name, body) => c.post<User>('/v2/security/user', body, { name }),
      updateUser: (name, body) => c.put<User>('/v2/security/user', body, { name }),
      removeUser: (name) => c.del<void>('/v2/security/user', { name }),
      changePassword: (name, body) => c.post<void>('/v2/security/user/password', body, { name }),
      listRoles: () => c.get<RoleList>('/v2/security/roles'),
      getRole: (name) => c.get<Role>('/v2/security/role', { name }),
      // Create-or-update: the v2 API uses PUT (not POST) for /v2/security/role.
      createRole: (name, body) => c.put<Role>('/v2/security/role', body, { name }),
      updateRole: (name, body) => c.put<Role>('/v2/security/role', body, { name }),
      removeRole: (name) => c.del<void>('/v2/security/role', { name }),
      getRoleOwners: (name) => c.get<RoleOwnerList>('/v2/security/role/owners', { name }),
      listResources: () => c.get<ResourceList>('/v2/security/resources'),
      getResource: (name) => c.get<Resource>('/v2/security/resource', { name }),
      listServices: () => c.get<ServiceList>('/v2/security/services'),
      getService: (name) => c.get<Service>('/v2/security/service', { name }),
      listPrivilegedRoutines: () => c.get<PrivilegedRoutineApplicationList>('/v2/security/privileged-routines'),
      listSQLPrivileges: (q) => c.get<SQLPrivilegeList>('/v2/security/sql-privileges', q),
      grantSQLPrivilege: (q) => c.post<void>('/v2/security/sql-privilege/grant', undefined, q),
      revokeSQLPrivilege: (q) => c.post<void>('/v2/security/sql-privilege/revoke', undefined, q),
      listSQLColumnPrivileges: (q) => c.get<SQLColumnPrivilegeList>('/v2/security/sql-column-privileges', q),
      getWebAuth: () => c.get<WebAuthenticationSettings>('/v2/security/web-auth'),
      setWebAuth: (body) => c.put<WebAuthenticationSettings>('/v2/security/web-auth', body),
    },
    security: {
      listWalletCollections: () => c.get<WalletCollectionList>('/v2/wallet/collections'),
      getWalletCollection: (name) => c.get<WalletCollection>('/v2/wallet/collection', { name }),
      createWalletCollection: (name, body) => c.put<WalletCollection>('/v2/wallet/collection', body, { name }),
      updateWalletCollection: (name, body) => c.put<WalletCollection>('/v2/wallet/collection', body, { name }),
      removeWalletCollection: (name) => c.del<void>('/v2/wallet/collection', { name }),
      listWalletSecrets: (name) => c.get<WalletSecretList>('/v2/wallet/secrets', { collection: name }),
      createWalletSecret: (name, body) => c.put<WalletSecret>('/v2/wallet/secret', body, { name }),
      removeWalletSecret: (name) => c.del<void>('/v2/wallet/secret', { name }),
      listX509Credentials: () => c.get<X509CredentialsList>('/v2/security/x509-credentials'),
      getX509Credential: (alias) => c.get<X509Credential>('/v2/security/x509-credential', { alias }),
      createX509Credential: (alias, body) => c.post<X509Credential>('/v2/security/x509-credential', body, { alias }),
      updateX509Credential: (alias, body) => c.put<X509Credential>('/v2/security/x509-credential', body, { alias }),
      removeX509Credential: (alias) => c.del<void>('/v2/security/x509-credential', { alias }),
      getX509Certificate: (alias) => c.get<X509CredentialCertificate>('/v2/security/x509-credential/certificate', { alias }),
      listOAuth2ServerDefinitions: () => c.get<OAuth2ServerDefinition[]>('/v2/security/oauth2/client/server-definitions'),
      getOAuth2ServerDefinition: (id) => c.get<OAuth2ServerDefinition>('/v2/security/oauth2/client/server-definition', { serverId: id }),
      createOAuth2ServerDefinition: (body) => c.post<OAuth2ServerDefinition>('/v2/security/oauth2/client/server-definition', body),
      removeOAuth2ServerDefinition: (id) => c.del<void>('/v2/security/oauth2/client/server-definition', { serverId: id }),
      getOAuth2ServerConfig: () => c.get<OAuth2ServerConfiguration>('/v2/security/oauth2/server'),
      listOAuth2Clients: () => c.get<OAuth2ServerClientList>('/v2/security/oauth2/server/clients'),
      getOAuth2Client: (id) => c.get<OAuth2ServerClient>('/v2/security/oauth2/server/client', { clientId: id }),
      createOAuth2Client: (body) => c.post<OAuth2ServerClient>('/v2/security/oauth2/server/client', body),
      removeOAuth2Client: (id) => c.del<void>('/v2/security/oauth2/server/client', { clientId: id }),
      changeOAuth2ClientSecret: (id, body) => c.post<void>('/v2/security/oauth2/server/client/secret', body, { clientId: id }),
      listOAuth2ResourceServers: () => c.get<OAuth2ResourceServerList>('/v2/security/oauth2/resource-servers'),
      getOAuth2ResourceServer: (name) => c.get<OAuth2ResourceServer>('/v2/security/oauth2/resource-server', { name }),
      createOAuth2ResourceServer: (name, body) => c.put<OAuth2ResourceServer>('/v2/security/oauth2/resource-server', body, { name }),
      updateOAuth2ResourceServer: (name, body) => c.put<OAuth2ResourceServer>('/v2/security/oauth2/resource-server', body, { name }),
      removeOAuth2ResourceServer: (name) => c.del<void>('/v2/security/oauth2/resource-server', { name }),
      listOAuth2ResourceServerMappings: () => c.get<OAuth2ResourceServerMappingList>('/v2/security/oauth2/resource-server/mappings'),
      listSSLConfigurations: () => c.get<SSLConfigurationList>('/v2/security/ssl-configurations'),
      getSSLConfiguration: (name) => c.get<SSLConfig>('/v2/security/ssl-configuration', { name }),
      createSSLConfiguration: (name, body) => c.put<SSLConfig>('/v2/security/ssl-configuration', body, { name }),
      updateSSLConfiguration: (name, body) => c.put<SSLConfig>('/v2/security/ssl-configuration', body, { name }),
      removeSSLConfiguration: (name) => c.del<void>('/v2/security/ssl-configuration', { name }),
      testSSLConfiguration: (name) => c.post<void>('/v2/security/ssl-configuration/test', undefined, { name }),
      getEncryptionSettings: () => c.get<EncryptionSettings>('/v2/security/encryption/settings'),
      setEncryptionSettings: (body) => c.put<EncryptionSettings>('/v2/security/encryption/settings', body),
      listMFTConnections: () => c.get<MFTConnectionList>('/v2/security/mft/connections'),
      getMFTConnection: (name) => c.get<MFTConnection>('/v2/security/mft/connection', { connection: name }),
      listLDAPConfigurations: () => c.get<LDAPConfigurationList>('/v2/security/ldap/configurations'),
      getLDAPConfiguration: (name) => c.get<LDAPConfig>('/v2/security/ldap/configuration', { name }),
      testLDAP: (body) => c.post<void>('/v2/security/ldap/test', body),
      listSuperservers: () => c.get<SuperserverList>('/v2/security/superservers'),
      getSuperserver: (port, bindAddress) => c.get<Superserver>('/v2/security/superserver', { port, bindAddress }),
      // encryption keys
      listEncryptionKeys: () => c.get<EncryptionKeyList>('/v2/security/encryption/keys'),
      listDataElementKeys: () => c.get<DataElementKeyList>('/v2/security/encryption/data-element-keys'),
      getEncryptionFileAdmins: (file) => c.get<EncryptionFileAdminList>('/v2/security/encryption/file/admins', { file }),
      getEncryptionFileKeys: (file) => c.get<EncryptionFileKeyList>('/v2/security/encryption/file/keys', { file }),
      deactivateEncryptionKey: (body) => c.post<void>('/v2/security/encryption/key/deactivate', body),
      // oauth2 (additional)
      getOAuth2ClientConfigurations: (serverId) => c.get<unknown>('/v2/security/oauth2/client/client-configurations', { serverId }),
      getOAuth2ResourceServerMappings: (service) => c.get<OAuth2ResourceServerMappingList>('/v2/security/oauth2/resource-server/mappings', { service }),
      // filesystem access purposes
      listFsAccessPurposes: () => c.get<FSAccessPurposeList>('/v2/fs-access-purposes'),
      getFsAccessPurpose: (purpose) => c.get<FSAccessPurpose>('/v2/fs-access-purpose', { purpose }),
      listFsAccessPurposePaths: (purpose) => c.get<FSAccessPathList>('/v2/fs-access-purpose/paths', { purpose }),
      // encryption keys (write)
      createEncryptionKey: (body) => c.post<void>('/v2/security/encryption/file', body),
      activateEncryptionKey: (body) => c.post<void>('/v2/security/encryption/file/activate', body),
      addEncryptionFileAdmin: (body) => c.post<void>('/v2/security/encryption/file/admin', body),
      removeEncryptionFileAdmin: (file) => c.del<void>('/v2/security/encryption/file/admin', { file }),
      addEncryptionFileKey: (body) => c.post<void>('/v2/security/encryption/file/key', body),
      removeEncryptionFileKey: (file) => c.del<void>('/v2/security/encryption/file/key', { file }),
      // oauth2 (write)
      // Paths must include the `/client/` segment (matches the spec and the
      // read-side getOAuth2ServerDefinition above).
      initialOAuth2AccessToken: (serverId) => c.post<void>('/v2/security/oauth2/client/server-definition/initial-access-token', { serverId }),
      updateOAuth2ServerDefinition: (serverId, body) => c.put<void>('/v2/security/oauth2/client/server-definition', { ...body, serverId }),
      updateOAuth2Client: (clientId, body) => c.put<void>('/v2/security/oauth2/server/client', { ...body, clientId }),
      updateOAuth2ServerConfig: (body) => c.put<void>('/v2/security/oauth2/server', body),
      removeOAuth2ServerConfig: () => c.del<void>('/v2/security/oauth2/server'),
      changeOAuth2ServerPassword: (body) => c.post<void>('/v2/security/oauth2/server/password', body),
      postOAuth2ResourceServerSecret: (name) => c.post<void>('/v2/security/oauth2/resource-server/secret', { name }),
      getOAuth2ClientConfiguration: (applicationName) => c.get<unknown>('/v2/security/oauth2/client/client-configuration', { applicationName }),
      updateOAuth2ClientConfiguration: (applicationName, body) => c.put<void>('/v2/security/oauth2/client/client-configuration', { ...body, applicationName }),
      removeOAuth2ClientConfiguration: (applicationName) => c.del<void>('/v2/security/oauth2/client/client-configuration', { applicationName }),
      registerOAuth2Client: (applicationName) => c.post<void>('/v2/security/oauth2/client/client-configuration/register-client', { applicationName }),
      rotateOAuth2ClientKeys: (applicationName) => c.post<void>('/v2/security/oauth2/client/client-configuration/rotate-keys', { applicationName }),
      createOAuth2ClientSecrets: (applicationName, body) => c.post<void>('/v2/security/oauth2/client/client-configuration/secrets', { ...body, applicationName }),
      getOAuth2ResourceServerMapping: (key) => c.get<unknown>('/v2/security/oauth2/resource-server/mapping', { key }),
      updateOAuth2ResourceServerMapping: (key, body) => c.put<void>('/v2/security/oauth2/resource-server/mapping', { ...body, key }),
      removeOAuth2ResourceServerMapping: (key) => c.del<void>('/v2/security/oauth2/resource-server/mapping', { key }),
      // mft / ldap (write)
      updateMFTConnection: (connection, body) => c.put<void>('/v2/security/mft/connection', body, { connection }),
      removeMFTConnection: (connection) => c.del<void>('/v2/security/mft/connection', { connection }),
      revokeMFTToken: (connection) => c.del<void>('/v2/security/mft/connection/token', { connection }),
      getMFTAuthCodeUrl: (connection, q) => c.get<unknown>('/v2/security/mft/connection/auth-code-url', { connection, ...q }),
      updateLDAPConfiguration: (name, body) => c.put<void>('/v2/security/ldap/configuration', body, { name }),
      removeLDAPConfiguration: (name) => c.del<void>('/v2/security/ldap/configuration', { name }),
      searchLdapPassword: (name, body) => c.post<unknown>('/v2/security/ldap/configuration/search-password', { LDAPSearchPassword: body.Password }, { name }),
      testLdapLogin: (body) => c.post<void>('/v2/security/ldap/test', body),
      // superservers (write)
      updateSuperserver: (port, body) => c.put<void>('/v2/security/superserver', { ...body, port }),
      removeSuperserver: (port) => c.del<void>('/v2/security/superserver', { port }),
      // privileged routines (write)
      listPrivilegedRoutines: () => c.get<unknown[]>('/v2/security/privileged-routines'),
      getPrivilegedRoutine: (name) => c.get<unknown>('/v2/security/privileged-routine', { name }),
      updatePrivilegedRoutine: (name, body) => c.put<void>('/v2/security/privileged-routine', { ...body, name }),
      removePrivilegedRoutine: (name) => c.del<void>('/v2/security/privileged-routine', { name }),
      // resources / services (write)
      updateResource: (name, body) => c.put<void>('/v2/security/resource', { ...body, name }),
      updateService: (name, body) => c.put<void>('/v2/security/service', { ...body, name }),
      // sql privileges (read + write; `grantee` required, `namespace` for column/admin)
      listSqlPrivileges: (q) => c.get<unknown[]>('/v2/security/sql-privileges', q),
      listSqlAdminPrivileges: (q) => c.get<unknown[]>('/v2/security/sql-admin-privileges', q),
      listSqlColumnPrivileges: (q) => c.get<unknown[]>('/v2/security/sql-column-privileges', q),
      grantSqlAdminPrivilege: (body) => c.post<void>('/v2/security/sql-admin-privilege/grant', body),
      revokeSqlAdminPrivilege: (body) => c.post<void>('/v2/security/sql-admin-privilege/revoke', body),
      grantSqlColumnPrivilege: (body) => c.post<void>('/v2/security/sql-column-privilege/grant', body),
      revokeSqlColumnPrivilege: (body) => c.post<void>('/v2/security/sql-column-privilege/revoke', body),
      // audit events (write)
      updateAuditEvent: (q, body) => c.put<void>('/v2/security/audit/event', body, q),
      removeAuditEvent: (q) => c.del<void>('/v2/security/audit/event', q),
      clearAuditEventCount: (q) => c.post<void>('/v2/security/audit/event/clear-count', undefined, q),
      // web-auth (write)
      changeWebAuthSmtpPassword: (body) => c.post<void>('/v2/security/web-auth/smtp-password', body),
    },
    tasks: {
      list: () => c.get<TaskList>('/v2/tasks'),
      get: (id) => c.get<Task>('/v2/task', { id }),
      create: (id, body) => c.post<Task>('/v2/task', body, { id }),
      update: (id, body) => c.put<Task>('/v2/task', body, { id }),
      remove: (id) => c.del<void>('/v2/task', { id }),
      run: (id, body) => c.post<void>('/v2/task/run', body, { id }),
      suspend: (id) => c.post<void>('/v2/task/suspend', undefined, { id }),
      resume: (id) => c.post<void>('/v2/task/resume', undefined, { id }),
      history: () => c.get<TaskHistory[]>('/v2/task/history'),
      upcoming: () => c.get<UpcomingTasks>('/v2/task/upcoming'),
      managerStatus: () => c.get<unknown>('/v2/task/manager'),
      runManager: () => c.post<void>('/v2/task/manager/run'),
      suspendManager: () => c.post<void>('/v2/task/manager/suspend'),
      resumeManager: () => c.post<void>('/v2/task/manager/resume'),
      listAsync: (q) => c.get<AsyncTaskList>('/v2/async-results', q),
      getAsync: (id) => c.get<AsyncTask>('/v2/async-result', { id }),
      cancelAsync: (id) => c.post<AsyncTask>('/v2/async-result/cancel', undefined, { id }),
      pauseAsync: (id) => c.post<AsyncTask>('/v2/async-result/pause', undefined, { id }),
      resumeAsync: (id) => c.post<AsyncTask>('/v2/async-result/resume', undefined, { id }),
      // Verified shapes (IRIS 2026.2): the detail/info/put/delete param is the numeric `id`.
      getTask: (id) => c.get<Task>('/v2/task', { id }),
      getTaskInfo: (id) => c.get<TaskExtraInfo>('/v2/task/info', { id }),
      createTask: (body) => c.post<Task>('/v2/task', body),
      updateTask: (id, body) => c.put<Task>('/v2/task', { ...body, id }),
      removeTask: (id) => c.del<void>('/v2/task', { id }),
    },
    system: {
      listProcesses: () => c.get<ProcessList>('/v2/processes'),
      getProcess: (id) => c.get<Process>('/v2/process', { id }),
      suspendProcess: (id) => c.post<void>('/v2/process/suspend', undefined, { id }),
      resumeProcess: (id) => c.post<void>('/v2/process/resume', undefined, { id }),
      terminateProcess: (id) => c.post<void>('/v2/process/terminate', undefined, { id }),
      broadcast: (message, pidList) => c.post<void>('/v2/process/broadcast', { Message: message, PidList: pidList }),
      listDevices: () => c.get<DeviceList>('/v2/devices'),
      getDevice: (name) => c.get<Device>('/v2/device', { name }),
      listDeviceSubTypes: () => c.get<DeviceSubTypeList>('/v2/device/subtypes'),
      getDeviceSettings: () => c.get<DeviceSettings>('/v2/device/settings'),
      setDeviceSettings: (body) => c.put<DeviceSettings>('/v2/device/settings', body),
      systemUsage: () => c.get<SystemUsageStats>('/v2/monitor/system-usage'),
      sharedMemoryUsage: () => c.get<SharedMemoryUsage>('/v2/monitor/system-usage/shared-memory'),
      mainDashboard: () => c.get<MainDashboardStats>('/v2/monitor/dashboard/main'),
      systemResources: () => c.get<SystemResourcesStats>('/v2/monitor/dashboard/system-resources'),
      licenseUsage: () => c.get<LicenseUsage>('/v2/monitor/license-usage'),
      listLocks: () => c.get<LockList>('/v2/locks'),
      listLocalDatabases: () => c.get<LocalDatabaseList>('/v2/database-dirs'),
      getLocalDatabase: (dir) => c.get<LocalDatabase>('/v2/database-dir', { dir }),
      databaseInfo: (dir) => c.postAsync('/v2/database-dir/info', undefined, { dir }),
      listVolumes: (dir) => c.get<VolumeFile[]>('/v2/database-dir/volumes', { dir }),
      truncateDatabase: (dir, targetSizeMb) => c.postAsync('/v2/database-dir/truncate', { TargetSize: targetSizeMb }, { dir }),
      modifySizeDatabase: (dir, sizeMb) => c.postAsync('/v2/database-dir/modify-size', { Size: sizeMb }, { dir }),
      expandVolumeDatabase: (dir, initialSizeMb) => c.postAsync('/v2/database-dir/expand-volume', { InitialSize: initialSizeMb }, { dir }),
      integrityCheckDatabase: (dir, body) => c.postAsync('/v2/database-dir/integrity-check', body ?? { Databases: [{ Directory: dir }] }, { dir }),
      createLocalDatabase: (dir, body) => c.post<LocalDatabase>('/v2/database-dir', body, { dir }),
      removeLocalDatabase: (dir) => c.del<void>('/v2/database-dir', { dir }),
      mountDatabase: (dir) => c.postAsync('/v2/database-dir/mount', undefined, { dir }),
      dismountDatabase: (dir) => c.postAsync('/v2/database-dir/dismount', undefined, { dir }),
      compactDatabase: (dir) => c.postAsync('/v2/database-dir/compact', undefined, { dir }),
      defragmentDatabase: (dir) => c.postAsync('/v2/database-dir/defragment', undefined, { dir }),
      listDatabases: () => c.get<ConfigDatabaseList>('/v2/databases'),
      getDatabase: (name) => c.get<ConfigDatabase>('/v2/database', { name }),
      getDeviceSubtype: (name) => c.get<unknown>('/v2/device/subtype', { name }),
      // `name` is a required body field (a 400 with an empty body reveals it).
      upsertDeviceSubtype: (body) => c.put<void>('/v2/device/subtype', body),
      removeDeviceSubtype: (name) => c.del<void>('/v2/device/subtype', { name }),
      upsertDevice: (body) => c.put<void>('/v2/device', body),
      removeDevice: (name) => c.del<void>('/v2/device', { name }),
      releaseLock: (id) => c.del<void>('/v2/lock', { id }),
    },
    logs: {
      listJournalFiles: () => c.get<JournalFileList>('/v2/journal/files'),
      getJournalFile: (file) => c.get<JournalFile>('/v2/journal/file', { file }),
      // POST-only + query params (a JSON body 400s); async (202 + Location).
      listJournalRecords: (file, q) => c.postAsync('/v2/journal/file/records', undefined, { file, ...q }),
      getJournalRecord: (file, address) => c.get<JournalRecord>('/v2/journal/file/record', { file, address }),
      getJournalSettings: () => c.get<JournalSettings>('/v2/journal/settings'),
      setJournalSettings: (body) => c.put<JournalSettings>('/v2/journal/settings', body),
      listAuditEvents: () => c.get<AuditEventList>('/v2/security/audit/events'),
      getAuditEvent: (source, type, name) => c.get<AuditEvent>('/v2/security/audit/event', { source, type, name }),
      // POST with a JSON body; async (202 + Location).
      listAuditRecords: (q) => c.postAsync('/v2/security/audit/records', q ?? {}),
      isAuditingEnabled: () => c.get<AuditingEnabled>('/v2/security/audit/enabled'),
      setAuditingEnabled: (body) => c.put<AuditingEnabled>('/v2/security/audit/enabled', body),
      purgeAuditRecords: (body) => c.post<void>('/v2/security/audit/record/purge', body),
      getAuditRecord: (utcTimeStamp, systemID, auditIndex) =>
        c.get<AuditRecord>('/v2/security/audit/record', { UTCTimeStamp: utcTimeStamp, SystemID: systemID, AuditIndex: auditIndex }),
      // Async (202 + Location): fire the journal integrity-check task.
      integrityCheck: (file) => c.postAsync('/v2/journal/file/integrity-check', {}, { file }),
      // No required params (409 when only one directory).
      switchDir: () => c.post<void>('/v2/journal/switch-dir'),
      // No params — EXECUTES on call.
      switchFile: () => c.post<void>('/v2/journal/switch-file'),
    },
    ecp: {
      getSettings: () => c.get<ECPSettings>('/v2/ecp/settings'),
      setSettings: (body) => c.put<ECPSettings>('/v2/ecp/settings', body),
      listDataServers: () => c.get<ECPDataServerList>('/v2/ecp/data-servers'),
      getDataServer: (name) => c.get<ECPDataServer>('/v2/ecp/data-server', { name }),
      listDataServerDatabases: (name) => c.get<unknown>('/v2/ecp/data-server/databases', { name }),
      listApplicationServers: () => c.get<ECPClientList>('/v2/ecp/application-servers'),
      getApplicationServer: (name) => c.get<unknown>('/v2/ecp/application-server', { name }),
      listSslConnections: () => c.get<ECPSSLConnectionList>('/v2/ecp/application-server-ssl-connections'),
      // `name` is a query param; `Action` is in the body.
      dataServerAction: (name, action) => c.post<void>('/v2/ecp/data-server/action', { Action: action }, { name }),
      // Verified shapes: `name` is the required body field (lowercase) / query param.
      upsertDataServer: (body) => c.put<void>('/v2/ecp/data-server', body),
      removeDataServer: (name) => c.del<void>('/v2/ecp/data-server', { name }),
      authorizeSslConnection: (name) => c.post<void>('/v2/ecp/application-server-ssl-connection/authorize', undefined, { name }),
      rejectSslConnection: (name) => c.post<void>('/v2/ecp/application-server-ssl-connection/reject', undefined, { name }),
      removeSslConnection: (name) => c.del<void>('/v2/ecp/application-server-ssl-connection', { name }),
    },
    extLang: {
      list: () => c.get<LanguageServerList>('/v2/ext-lang-servers'),
      get: (name) => c.get<LanguageServer>('/v2/ext-lang-server', { name }),
      activity: (name) => c.get<LanguageServerActivity>('/v2/ext-lang-server/activity', { name }),
      // `name` is a query param (a JSON body 400s).
      start: (name) => c.post<void>('/v2/ext-lang-server/start', undefined, { name }),
      stop: (name) => c.post<void>('/v2/ext-lang-server/stop', undefined, { name }),
      // `name` is a required body field (a 400 with an empty body reveals it).
      upsert: (name, body) => c.put<LanguageServer>('/v2/ext-lang-server', { name, ...body }),
      remove: (name) => c.del<void>('/v2/ext-lang-server', { name }),
    },
    namespaces: {
      list: () => c.get<NamespaceList>('/v2/namespaces'),
      get: (name) => c.get<Namespace>('/v2/namespace', { name }),
      // `name` is a required body field (a 400 with an empty body reveals it).
      create: (name, body) => c.put<void>('/v2/namespace', body, { name }),
      remove: (name) => c.del<void>('/v2/namespace', { name }),
      // `namespace` query param is REQUIRED by the live API; only send it when provided.
      listRoutineMappings: (namespace) => c.get<unknown[]>('/v2/namespace/routine-mappings', namespace ? { namespace } : undefined),
      getRoutineMapping: (name) => c.get<unknown>('/v2/namespace/routine-mapping', { name }),
      createRoutineMapping: (name, body) => c.put<void>('/v2/namespace/routine-mapping', body, { name }),
      removeRoutineMapping: (name) => c.del<void>('/v2/namespace/routine-mapping', { name }),
      listGlobalMappings: (namespace) => c.get<unknown[]>('/v2/namespace/global-mappings', namespace ? { namespace } : undefined),
      getGlobalMapping: (name) => c.get<unknown>('/v2/namespace/global-mapping', { name }),
      createGlobalMapping: (name, body) => c.put<void>('/v2/namespace/global-mapping', body, { name }),
      removeGlobalMapping: (name) => c.del<void>('/v2/namespace/global-mapping', { name }),
      listPackageMappings: (namespace) => c.get<unknown[]>('/v2/namespace/package-mappings', namespace ? { namespace } : undefined),
      getPackageMapping: (name) => c.get<unknown>('/v2/namespace/package-mapping', { name }),
      createPackageMapping: (name, body) => c.put<void>('/v2/namespace/package-mapping', body, { name }),
      removePackageMapping: (name) => c.del<void>('/v2/namespace/package-mapping', { name }),
      copyMappings: (body) => c.post<void>('/v2/namespace/copy-mappings', body),
      enableInterop: (name) => c.post<void>('/v2/namespace/enable-interop', { name }),
    },
    wqm: {
      listCategories: () => c.get<WQMCategoryList>('/v2/wqm-categories'),
      getCategory: (name) => c.get<WQMCategory & { Name?: string }>('/v2/wqm-category', { name }),
      upsertCategory: (name, body) => c.put<WQMCategory & { Name?: string }>('/v2/wqm-category', body, { name }),
      removeCategory: (name) => c.del<void>('/v2/wqm-category', { name }),
    },
    license: {
      getKey: () => c.get<unknown>('/v2/license/key'),
      validateKey: (key) => c.post<unknown>('/v2/license/key/validate', { Key: key }),
      activateKey: (key) => c.put<void>('/v2/license/key', { Key: key }),
      listServers: () => c.get<unknown[]>('/v2/license/servers'),
      getServer: (name) => c.get<unknown>('/v2/license/server', { name }),
      upsertServer: (name, body) => c.put<void>('/v2/license/server', body, { name }),
      removeServer: (name) => c.del<void>('/v2/license/server', { name }),
    },
    databases: {
      getDatabase: (name) => c.get<ConfigDatabase>('/v2/database', { name }),
      upsertDatabase: (name, body) => c.put<ConfigDatabase>('/v2/database', body, { name }),
      removeDatabase: (name) => c.del<void>('/v2/database', { name }),
      upsertDir: (dir, body) => c.put<LocalDatabase>('/v2/database-dir', body, { dir }),
      listDocDbs: () => c.get<DocDBApplicationList>('/v2/doc-dbs'),
      getDocDb: (name) => c.get<DocDBApplication>('/v2/doc-db', { name }),
      upsertDocDb: (name, body) => c.put<DocDBApplication>('/v2/doc-db', body, { name }),
      removeDocDb: (name) => c.del<void>('/v2/doc-db', { name }),
    },
  };
}
