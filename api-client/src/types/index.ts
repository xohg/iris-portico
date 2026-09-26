/**
 * Auto-generated from mainspec_v2.json by scripts/gen-types.js.
 * DO NOT EDIT BY HAND — re-run:  npm run gen-types
 *
 * OpenAPI title: SysAdmin APIs  version: 2
 * Schemas: 142
 */

export interface Alerts {
/** Number of serious alerts that have been raised. */
  SeriousAlerts?: number;
/** Number of application errors that have been logged. */
  ApplicationErrors?: number;
}

export interface AppServerSettings {
/** Maximum number of ECP servers that can be accessed from this system. Modifying this property may require a system restart. */
  MaxServers?: number;
/** Time a client should keep trying to restablish a connection before giving up or declaring connection failed (in seconds). */
  ClientReconnectDuration?: number;
/** Time (in seconds) a client should wait in between reconnection attempts when a server is not available. */
  ClientReconnectInterval?: number;
}

export interface AppServerStats {
/** The maximum possible number of ECP connections from this Application Server. */
  MaxConn?: number;
/** The number of current active ECP connections from this Application Server. */
  ActConn?: number;
/** The number of remote Global references made, i.e. the globals were not found in the local global cache. */
  GloRef?: number;
/** The number of Bytes sent. Note that this is currently only a 32 bit integer and may overflow quickly on a busy system. */
  ByteSent?: number;
/** The number of Bytes received. */
  ByteRcvd?: number;
/** The number of Blocks added to local cache. */
  BlockAdd?: number;
/** The number of Blocks purged by buffer allocation. */
  BlockBuffPurge?: number;
/** The number of Blocks purged as requested by a Data Server. */
  BlockSvrPurge?: number;
/** The number of Local global references. */
  GloRefLocal?: number;
/** The number of Remote global references. */
  GloRefRemote?: number;
/** The number of Local global updates. */
  GloUpdateLocal?: number;
/** The number of Local routine calls. */
  RoutineCallLocal?: number;
/** The number of Remote routine calls. */
  RoutineCallRemote?: number;
/** The number of Local routine buffer loads and saves. */
  RoutineBuffLocal?: number;
/** The number of Remote routine buffer loads and save. */
  RoutineBuffRemote?: number;
}

export type Application = {   AutheEnabled?: number; /** Authentication and Session mechanisms enabled. Note that these bits correspond to the same bit numbers in the Security.System class<br>Bit 2 = AutheK5API<br>Bit 5 - AuthePassword<br>Bit 6 = AutheUnaut */    AutoCompile?: boolean; /** This specifies whether CSP files should automatically compile or not. If this is turned on, then when a CSP file is more recent than its compiled class,<br>it is recompiled. This is normally something */    ChangePasswordPage?: string; /** A predefined change password page that can be sent out to the browser if the user account requires that a password change is required. */    CookiePath?: string; /** Scope of the session cookie. This determines which urls the browser will send the session cookie back to InterSystems IRIS. If your application name is 'myapp', it defaults to '/myapp/' meaning it wil */    CorsAllowlist?: string[]; /** List of Origins for CORS policies. This is an allowlist */    CorsCredentialsAllowed?: boolean; /** If true, Access-Control-Allow-Credentials header will be included in CORS-enabled responses. */    CorsHeadersList?: string[]; /** List of custom headers to include when CORS is enabled. */    CSPZENEnabled?: boolean; /** Indicates whether this application will process CSP/Zen Pages. */    CSRFToken?: boolean; /** Prevent login CSRF attack. When enabled generate a token and cookie in the login page that is validated before accepting any username/password. Enabling this will prevent programmatic access to pages  */    DeepSeeEnabled?: boolean; /** Indicates whether DeepSee access is enabled for this application. */    Description?: string; /** Application description. */    DispatchClass?: string; /** If defined this will dispatch all requests in this CSP application to this one class. This will bypass the normal url to classname conversion so allowing the specified class complete control over this */    Enabled?: boolean; /** Application is enabled. */    ErrorPage?: string; /** A CSP or CLS page that will be displayed if an error occurs when generating the page. */    EventClass?: string; /** This specifies the class whose methods are invoked for CSP application events,<br>such as a timeout. */    GroupById?: string; /** Indicates whether this application's authentication will move in sync with other applications in the same id group. */    iKnowEnabled?: boolean; /** Indicates whether iKnow access is enabled for this application. Like the DeepSeeEnabled property, this corresponds with the Analytics option shown in Management Portal. */    InbndWebServicesEnabled?: boolean; /** Indicates whether this application will process Web Services. Corresponds with the "Inbound Web Services" option shown in Management Portal. */    IsNameSpaceDefault?: boolean; /** Indicates that this application is the default application for its namespace. As such it will be returned by the call $System.CSP.GetDefaultApp(). */    JWTAuthEnabled?: boolean; /** Indicates that this application uses JWT Bearer tokens for authentication. For REST Web Application only */    JWTAccessTokenTimeout?: number; /** Specifies the timeout (in seconds) for JWT Access Tokens. This is only relevant for REST Web Applications where <i>JWTAuthEnabled</i> is true. */    JWTRefreshTokenTimeout?: number; /** Specifies the timeout (in seconds) for JWT Refresh Tokens. This is only relevant for REST Web Applications where <i>JWTAuthEnabled</i> is true. */    LockCSPName?: boolean; /** Lock CSP Name. If true, then you can only access this CSP page if the url you enter matches the url stored in the CSPURL parameter value in the class. CSP pages have the CSPURL set to the original url */    LoginPage?: string; /** A predefined login page that can be sent out to the browser if the application requires<br> an authenticated identity and one is not available yet */    MatchRoles?: {   MatchRole?: string;   TargetRoles?: string[]; }[]; /** Mapping of MatchRole/TargetRoles pairs to assign to the application<br>To specify a role to always be granted to an application, set MatchRole="" */    NameSpace?: string; /** The namespace where pages for this application are run. Required on creation, optional on updates. */    Package?: string; /** Specifies the package to prefix to the class name for all CSP files in this application. If not specified it defaults to "csp" */    Path?: string; /** This specifies the physical path (directory) for the CSP files on the InterSystems IRIS server. */    PermittedClasses?: string; /** A name pattern which is used to limit the classes which may be run in this application. This is an ObjectScript pattern. For example: 1(1"B",1"A".1N) matches {B.cls, A0.cls ... A9.cls} */    Recurse?: boolean; /** This specifies whether to use subdirectories. If WPath is the Web Path and PPath is the Physical Path, then with recurse turned on,<br>WPath/xxx/yyy will look in PPath/xxx/yyy. If recurse is turned of */    RedirectEmptyPath?: boolean; /** This specifies whether to use FHIR-standard redirects of empty paths. For REST Web Application only. For example, if the request is for WPath/csp/appname and the app /csp/appname/<br>has this property */    Resource?: string; /** The Resource name that controls access to this application. If no resource is defined, then it is a public application which anyone can run */    ServeFiles?: "Never" | "Always" | "Always and cached" | "Use CSP security"; /** Allows the web server built into InterSystems IRIS to serve up static files, e.g., html or jpg files, from this application path. This also allows the stream server to serve files from this path. */    ServeFilesTimeout?: number; /** Time, in seconds, of how long to cache static files */    SuperClass?: string; /** This specifies the default superclass. If blank, it defaults to %CSP.Page */    Timeout?: number; /** This specifies the default session timeout, in seconds */    TraceEnabled?: boolean; /** This specifies if automated OTel Traces are enabled for this Application. Only used for CSP/SOAP and REST Web Services. */    TwoFactorEnabled?: boolean; /** This specifies whether to use two-factor authentication for this application. Two Factor Authentication is used with Password authentication which causes a security token to be sent to the user. To co */    Type?: number; /** Type - Bitmap describing the type of application<br>Bit 0 = System Application - Reserved.<br>Bit 1 = CSP/REST Web Application (Default)<br>Bit 2 = Privileged routine application<br>Bit 3 = DocDB/Clie */    UseCookies?: "Never" | "AutoDetect" | "Always"; /** This specifies whether to use cookies for CSP session management or not. For REST and CSP Web Application only. You can set this on a per-application basis. It does NOT affect the user's use of<br>coo */    SessionScope?: "None" | "Lax" | "Strict"; /** SameSite value that is used for CSP Session cookies. For REST and CSP Web Application only. This setting affects whether session cookies are sent for cross-site requests. The default setting for a new */    UserCookieScope?: "None" | "Lax" | "Strict"; /** Default SameSite value for cookies created by users' calls to %CSP.Response.SetCookie(). For REST and CSP Web Application only. This setting affects whether session cookies are sent for cross-site req */    WSGIAppLocation?: string; /** This is the path of the directory containing the python application */    WSGIAppName?: string; /** This is the name of the WSGI-compliant python application (e.g flask_app) */    WSGICallable?: string; /** This is the name of the WSGI application callable. */    WSGIDebug?: boolean; /** This describes if the WSGI application is in Debug Mode */    WSGIType?: number; /** This determines if the application is WSGI or ASGI compliant. */  };

export type AsyncTask = (AsyncTaskBase) & ({   Console?: string[]; /** Messages from the task */    Result?: (AsyncTaskResultListAuditRecords | {  } | AsyncTaskResultDatabaseMetrics | AsyncTaskResultJournalRecordList | AsyncTaskResultDBDefragment | AsyncTaskResultDBCompact | AsyncTaskResultDBIntegrityCheck); });

export type AsyncTaskBase = {   GUID?: string;   TaskName?: string;   State?: "Queued" | "Running" | "Finished" | "Failed" | "Canceled" | "Paused";   FailureReason?: string;   TimeQueued?: string;   TimeStarted?: string; /** Will be blank if the task has not yet started. */    TimeFinished?: string; /** Will be blank if the task has not yet finished. */  };

export type AsyncTaskList = AsyncTaskBase[];

export type AsyncTaskResultDBCompact = (AsyncTaskResultSysBGTask) & ({   Database?: string;   BlocksScanned?: any; /** Number of blocks scanned as part of compaction. This includes blocks that have been relocated, either explicity because they needed to be moved, or incidentally as part of the operation. Also includes */  });

export type AsyncTaskResultDBDefragment = (AsyncTaskResultSysBGTask) & ({   Database?: string; });

export type AsyncTaskResultDBIntegrityCheck = (AsyncTaskResultSysBGTask) & ({   GlobalsChecked?: number; /** A count of globals checked so far, updated periodically. */    ErrorCount?: number; /** A count of errors detected so far, updated periodically. */  });

export type AsyncTaskResultDatabaseMetrics = {   Blocks?: number; /** Current number of blocks */    BlockSize?: 2048 | 4096 | 8192 | 16384 | 32768 | 65536; /** Block size in bytes of the database. <br>Either 2048, 4096, 8192, 16384, 32768, or 65536 */    Encrypted?: boolean; /** Database is encrypted */    EncryptionKeyID?: string; /** Database encryption key ID */    ExpansionSize?: number; /** Size in MB to Expand by. <br>0 - Use system defaults (recommended) */    Full?: boolean; /** False - Database is not marked as full<br>True - Database is marked as full */    LastExpansionTime?: string; /** Last time database expanded, converted to local time. */    MaxSize?: number; /** Maximum size in MB, 0=unlimited (recommended). */    Mirrored?: boolean; /** Database is marked as mirrored */    MirrorSetName?: string; /** Mirror set name of this mirrored database. Blank if not a mirrored database. */    ReadOnlyReason?: string; /** Read-Only reason text. */    Size?: number; /** Size in MB. */    AvailableSpace?: number; /** Number of MB of free space */    DiskFree?: string; /** Amount of free space on the disk, if applicable. Units will be included in the string */    EndFree?: number; /** Amount of free space at the end of the database, in MB */    Mounted?: boolean; /** Whether or not the database is currently mounted */    MirrorDBName?: string; /** Name by which the database will be known in the mirror. Blank if not a mirrored database. */    MirrorFailoverDB?: boolean; /** Mirrored database is on failover members */    SFN?: number; /** System File Number */  };

export interface AsyncTaskResultJournalRecordList {

}

export interface AsyncTaskResultListAuditRecords {

}

export interface AsyncTaskResultSysBGTask {
/** The current amount of progress made, to be interpreted along with the ProgressTotal and ProgressUnits properties */
  ProgressTotal?: number;
/** The total amount of progress that must be made to complete. This value may change while running as more accurate estimates become available. */
  ProgressCurrent?: number;
/** The units in which progress is measured. "" is allowed, treating progress as dimensionless. */
  ProgressUnits?: string;
/** Internal progress details */
  ProgressDetails?: string;
}

export interface AuditEvent {
/** Full event name (the `source` query param), e.g. `%System/%Login/LoginFailure`. */
  EventName?: string;
/** Event enabled. */
  Enabled?: boolean;
/** Total events recorded. */
  Total?: number;
/** Events successfully written. */
  Written?: number;
/** Events lost (failed to write). */
  Lost?: number;
}

export type AuditEventList = AuditEvent[];

export interface AuditRecord {
  AuditIndex?: string;
/** Authentication method process used. */
  Authentication?: string;
/** Executable name on the client machine. */
  ClientExecutableName?: string;
/** IP address of the client, as passed from client. This corresponds to the ClientIPAddress property in the class %SYS.ProcessQuery. */
  ClientIPAddress?: string;
/** Description of the audit event. */
  Description?: string;
/** Name of the audit event. */
  Event?: string;
/** EventData -- arbitrary data associated with this event. */
  EventData?: string;
/** Event Source (system events all have "%System" here). */
  EventSource?: string;
/** EventType. */
  EventType?: string;
/** Job ID */
  JobId?: number;
/** Job Number */
  JobNumber?: number;
/** Namespace process was executing in. */
  Namespace?: string;
/** Operating system username of process. Username given to the process by the operating system when the process is created. When displayed, it is truncated to 16 characters. Note that the real O/S userna */
  OSUsername?: string;
/** Process ID. Note that on VMS system, the Hex pid is stored internally as a decimal value, i.e. $zh(pid). */
  Pid?: string;
/** $ROLES value that was active when the audit event occurred. */
  Roles?: string;
/** Routine running including DB and System. */
  RoutineSpec?: string;
/** IP address of the client, as detected on the TCP channel by the server process. This corresponds to the StartupClientIPAddress property in the class %SYS.ProcessQuery. */
  StartupClientIPAddress?: string;
/** Any %Status variable passed into the call. */
  Status?: string;
/** SystemName:ConfigurationName of where the event was generated. This is useful when merging separate audit streams from different systems. */
  SystemID?: string;
/** User info field */
  UserInfo?: string;
/** Username from $Username that was active when audit event occurred. */
  Username?: string;
/** UTC $ZTIMESTAMP value when the audit event occurred. */
  UTCTimeStamp?: string;
}

export interface AuditingEnabled {
/** Required. */
  Enabled?: boolean;
}

export interface BaseResponse {
  status?: {   Errors?: string[];   summary?: string; };
  console?: string[];
}

export type BaseResponseWithResult = (BaseResponse) & ({   result?: Record<string, any>; });

export interface ConfigDatabase {
/** Specifies that the database MUST be successfully mounted at startup.<br>0 - Successful mount not required for startup to succeed.<br>1 - Successful mount required for startup to succeed. */
  MountRequired?: boolean;
/** On a clustered system, specifies whether the database should be mounted at startup.<br>This property is valid for cluster systems only, and is ignored for non-cluster systems.<br>False - Don't mount a */
  MountAtStartup?: boolean;
/** Database is configured to be mounted in cluster mode<br>If this property is set then this database has to be mounted explicitly. */
  ClusterMountMode?: boolean;
/** Directory where the database resides. On ECP Clients of a mirror this contains logical references to the databases on the failover mirror members as the path may be different on the various nodes. */
  Directory?: string;
/** Name of the remote server where the DB resides.<br>If empty, the database is local.<br>Remote server must already be configured to be entered here. */
  Server?: string;
/** Directory where the streams associated with this database go.<br>By default (value=""), the location is in the subdirectory "stream", underneath the database directory, e.g. for a database located in  */
  StreamLocation?: string;
}

export interface ConfigDatabaseList {

}

export type DataServerSettings = {   MaxServerConn?: number; /** Maximum number of application servers that can access this server simultaneously. Modifying this property may require a restart of the system to make it active. */    ServerTroubleDuration?: number; /** Time interval for troubled state (in seconds). Once this period of time has elapsed, the server will declare the connection dead and presume recovery is not possible. */    SSLECPServer?: 0 | 1 | 2; /** Use SSL/TLS for connections. 0 for Disabled, 1 For Enabled, 2 for Required */  };

export interface DataServersStats {
/** The number of global references that updated the database. */
  GloUpdate?: number;
/** The number of Requests received. */
  ReqRcvd?: number;
/** The number of request buffers processed. */
  ReqBuff?: number;
/** The number of Blocks sent. */
  BlockSent?: number;
/** The number of lock requests that are immediately granted. */
  LockGrant?: number;
/** The number of lock requests that immediately fail. */
  LockFail?: number;
/** The number of lock requests that are queued and later granted. */
  LockQueGrant?: number;
/** The number of lock requests that are queued and later fail. */
  LockQueFail?: number;
/** The number of blocks the server has requested the client to purge. */
  SvrBlockPurge?: number;
/** The number of messages sent by the server to purge a routine on the client. */
  RoutinePurge?: number;
/** The number of messages sent by the server for big kills. */
  BigKill?: number;
/** The number of times the block was not sent to the client because the result was a big string. */
  BigString?: number;
/** Maximum possible number of connections to this Data Server. */
  MaxConn?: number;
/** Number of current active connections to this Data Server. */
  ActConn?: number;
/** The number of Bytes received. Note that this is currently only a 32 bit integer and may overflow quickly on a busy system. */
  ByteRcvd?: number;
/** The number of Bytes sent. Note that this is currently only a 32 bit integer and may overflow quickly on a busy system. */
  ByteSent?: number;
/** The number of global references returned. */
  GloRef?: number;
}

export interface Device {
/** Alternate device ID (number) for this device. <br>All aliases must be unique. You can use this value to specify a device in an OPEN command, e.g 0PEN 210 */
  Alias?: number;
/** Device ID of an alternate device.<br>This allows a user using %IS to specify A as the device. The alternate device must be a defined mnemonic. */
  AlternateDevice?: string;
/** Enter a description of where the device is located. This field is for your<br>own reference to help you identify what machine you're configuring. */
  Description?: string;
/** Values that will be sent as the second argument for an OPEN command.<br>This value allows you to specify more specific terminal information. */
  OpenParameters?: string;
/** Physical device name used to refer to the device. Required on creation, optional on updates. */
  PhysicalDevice?: string;
/** Number of the prompt option desired.<br>Options:<br>NULL (blank) = user sees the device selection prompt with the default device defined<br>1 = automatically uses this device, if it is the current dev */
  Prompt?: number;
/** Options to refine the definition of your device SubTypes.<br>SubTypes specify terminal characteristics. They are used to create the appropriate OPEN command for the device. There should be SubType inf */
  SubType?: string;
/** Enter the type of device.<br>Options:<br>TRM = Terminal<br>SPL = Spooling device<br>MT = Magnetic Tape drive<br>BT = Cartridge tape drive<br>IPC = Interprocess communication<br>OTH = any other device  */
  Type?: string;
}

export interface DeviceList {

}

export interface DeviceSettings {
  IOSettings?: IOSettings;
  TelnetSettings?: TelnetSettings;
}

export interface DeviceSubType {
/** Enter the ASCII code that represents the backspace character on the selected<br>device in this form: $C(code1). Default depends on the device type. */
  Backspace?: string;
/** Enter the cursor control keys for the selected device.<br>Default depends on the device type. */
  CursorControl?: string;
/** Enter the ASCII code that represents erasing to the end of file on the<br>selected device in this form: $C(code1,code2...).<br>Default depends on the device type. */
  EraseEOF?: string;
/** Enter the ASCII code that represents erasing to the end of line on this device<br>in the form $C(code1,code2).<br>Default depends on the device type. */
  EraseEOL?: string;
/** Enter the ASCII code that represents a form feed on the selected device in this form:<br>#,$C(code1,code2...).<br>Default depends on the device type. */
  FormFeed?: string;
/** Enter the number that represents the location of the right margin.<br>Device output will wrap at that number of characters.<br>Default depends on the device type. Required on creation, optional on upd */
  RightMargin?: number;
/** Enter the number of lines that comprise one screen or page for the device. Required on creation, optional on updates. */
  ScreenLength?: number;
/** Enter the ASCII code that represents a backspace on the selected device in the form $C(code).<br>Default depends on the device type. */
  ZU22Backspace?: string;
/** Enter the ASCII code that represents a form feed on the selected device in the form $C(code1,code2).<br>Default depends on the device type. */
  ZU22FormFeed?: string;
}

export interface DeviceSubTypeList {

}

export interface DocDBApplication {
/** Description of the Doc DB. */
  Description?: string;
/** Doc DB enabled. */
  Enabled?: boolean;
  Resource?: string;
}

export interface DocDBApplicationList {

}

export interface ECP {
/** Summary status of ECP application servers connected to this system. */
  ECPClients?: string;
/** Most recently measured ECP application server traffic in bytes/second. */
  ECPClientTraffic?: number;
/** Summary status of ECP data servers this system is connected to. */
  ECPServers?: string;
/** Most recently measured ECP data server traffic in bytes/second. */
  ECPServerTraffic?: number;
/** Summary status of shadow connections on this data source. */
  ShadowConnections?: string;
}

export type ECPClientList = {   ClientName?: string;   Status?: "Normal" | "Trouble" | "Recovering" | "Restart" | "DeadCleanup" | "Invalid";   IPAddress?: string;   IPPort?: number; }[];

export interface ECPDataServer {
/** IP Address to connect to. Required on creation, optional on updates. */
  Address?: string;
/** ECP Server runs in batch mode. */
  BatchMode?: boolean;
/** Specifies the behavior of this connection with regard to mirrored database servers. Value:<br>0: Non-mirrored connection. Access databases on non-mirror members. Also used to connect to async members  */
  MirrorConnection?: number;
/** Use SSL configuration (%ECPClient) for the ECP connection. */
  SSLConfig?: boolean;
/** Port to connect to. Required on creation, optional on updates. */
  Port?: number;
}

export type ECPDataServerList = {   Name?: string;   RemoteAddress?: string;   RemotePort?: number;   Status?: "Invalid" | "Init" | "Not Connected" | "Connection in Progress" | "Connection Failed" | "Disabled" | "Normal" | "Trouble" | "Unknown";   MirrorConnection?: boolean;   SSLConfig?: boolean;   BatchMode?: boolean; }[];

export type ECPSSLConnectionList = {   SSLComputerName?: string;   ClientIP?: string;   Status?: "Pending" | "Authorized"; }[];

export interface ECPSettings {
  AppServerSettings?: AppServerSettings;
  DataServerSettings?: DataServerSettings;
}

export interface ECPStats {
  AppServer?: AppServerStats;
  DataServer?: DataServersStats;
}

export type EncryptionSettings = {   DBEncStartMode?: "None" | "Interactive" | "Unattended" | "KMIP"; /** Required. */    DBEncJournal?: boolean; /** Encrypt journal files. Required. */    DBEncIRISSecurity?: boolean; /** Encrypt IRISSECURITY database. Required. */    DBEncIRISTemp?: boolean; /** Encrypt IRISTEMP database. Required. */    AuditEncrypt?: boolean; /** Encrypt the audit database. Required. */    DBEncStartKMIPServer?: string; /** KMIPServer instance name (for DBEncStartMode mode=3). Required. */    DBEncStartKeyFile?: string; /** Key file name (for DBEncStartMode mode=2). Required. */    DBEncDefaultKeyID?: string; /** Database encryption key ID to use for new encrypted databases */    DBEncJournalKeyID?: string; /** Database encryption key ID to use for encrypting journal files */  };

/** One database-encryption key (`GET /v2/security/encryption/keys`). */
export type EncryptionKeyList = {   Id?: string;   /** Number of bits in the key, e.g. 128 or 256. */   KeyLen?: number;   IsDefault?: boolean; }[];

/** One data-element key (`GET /v2/security/encryption/data-element-keys`). */
export type DataElementKeyList = {   Id?: string; }[];

/** One entry of `GET /v2/security/encryption/file/admins` (key-file admins). */
export type EncryptionFileAdminList = {   Name?: string;   Password?: string; }[];

/** One entry of `GET /v2/security/encryption/file/keys` (keys stored in a key file). */
export type EncryptionFileKeyList = {   Id?: string;   KeyLen?: number;   IsDefault?: boolean; }[];

export type FSAccessPathList = {   Purpose?: string;   RootPath?: string; }[];

export interface FSAccessPurpose {
/** Whether or not the purpose-level restriction flag is enabled for the given purpose in the security database */
  Restricted?: boolean;
}

export type FSAccessPurposeList = {   Purpose?: string;   Restricted?: boolean; }[];

/** Result of `GET /v2/ext-lang-server/activity` (live-verified shape). */
export interface LanguageServerActivity {
  Activity?: LanguageServerActivityList;
  CurrentlyRunning?: boolean;
}

export interface GlobalMappingList {

}

export interface GlobalsAndRoutinesStats {
  Globals?: GlobalsStats;
  Routines?: RoutinesStats;
}

export interface GlobalsStats {
/** Local global references. The count of all global accesses to a local database. */
  RefLocal?: number;
/** Local global update references. The count of local global references that are SETs or KILLs, etc. */
  RefUpdateLocal?: number;
/** Remote global references. The count of all global accesses to a remote database. */
  RefRemote?: number;
/** Remote global update references. The count of remote global references that are SETs or KILLs, etc. */
  RefUpdateRemote?: number;
/** Private global references. The count of all process private global references. */
  RefPrivate?: number;
/** Private global update references. The count of process private global references that are SETs or KILLs, etc. */
  RefUpdatePrivate?: number;
/** Logical block requests. The number of times a database block was accessed. */
  LogicalBlocks?: number;
/** Physical block reads. The number of physical database blocks read from disk. */
  PhysBlockReads?: number;
/** Physical block writes. The number of physical database blocks written to disk. */
  PhysBlockWrites?: number;
/** WIJ writes. Number of writes to the write image journal file. */
  WIJWrites?: number;
/** Journal entries. Number of journal records created, one for each database modification (Set, Kill, etc.) or transaction event (TStart, TCommit) or other event that is saved to the journal. */
  JrnEntries?: number;
/** Journal block writes. Number of 64-KB journal blocks written to the journal file. */
  JrnBlocks?: number;
}

export interface IOSettings {
/** Routine to use in WRITE commands for sequential files */
  File?: string;
/** Routine to use in WRITE commands for magnetic tapes */
  MagTape?: string;
/** Routine to use in WRITE commands for other devices */
  Other?: string;
/** Routine to use in WRITE commands for terminals */
  Terminal?: string;
}

export type Info = {   apiVersion?: number;   username?: string;   serverVersion?: string;   systemMode?: string; /** Possible values include "", "LIVE", "TEST", "DEVELOPMENT" and "FAILOVER" */    product?: "iris" | "irisforhealth" | "healthconnect" | "hs";   namespaces?: {   name?: string; }[];   privileges?: {   ExternalLanguageServerEdit?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_ExternalLanguageServerEdit */    Journal?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_Journal */    Manage?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_Manage */    OAuth2_Client?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_OAuth2_Client */    OAuth2_Registration?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_OAuth2_Registration */    OAuth2_Server?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_OAuth2_Server */    Operate?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_Operate */    Secure?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_Secure */    Task?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_Task */    Wallet?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_Wallet */    FileSystemAccess?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_FileSystemAccess. This field is introduced with v2 of the /api/admin APIs. It might not be present in the GET /info response on older systems. */    ConfigStore?: {   use?: boolean; }; /** Permissions held by the user on the resource %Admin_ConfigStore. This field is introduced with v2 of the /api/admin APIs. It might not be present in the GET /info response on older systems. */  }; /** Permissions held by the user on various system-defined security resources. More fields may be added to this schema as IRIS evolves over time */  };

export interface JournalFile {
/** Address of first record in the journal file */
  FirstRecordAddress?: string;
/** Address of last record in the journal file */
  LastRecordAddress?: string;
  Databases?: {   SFN?: number;   DatabasePathOrAlias?: string; }[];
/** Blank if not a cluster journal file */
  ClusterStartTime?: string;
/** The end of the last valid journal record in the file (applicable to open file only) */
  End?: number;
  FileCount?: number;
/** Max allowable size of the journal file, in bytes */
  MaxSize?: number;
  MinTransFileCount?: number;
  MinTransFileIndex?: number;
  FileGUID?: string;
  CreationTime?: string;
  EncryptionKeyID?: string;
/** All fields are only present if relevant */
  "MirrorInfo "?: {   MirrorTransFileCount?: number;   MirrorMinTransFileIndex?: number;   MirrorFileEnd?: number;   MirrorGUID?: string;   SystemGUID?: string;   SessionGUID?: string; };
/** All fields within are only present if there is a previous file */
  PrevFile?: {   File?: string;   End?: number;   GUID?: string; };
/** All fields are only present if there is a next file */
  NextFile?: {   File?: string;   GUID?: string; };
}

export interface JournalFileList {

}

export interface JournalRecord {
/** Type of the record in string form */
  TypeName?: string;
/** Extended type of the record in string form */
  ExtTypeName?: string;
/** Location of previous record or 0 if this is the first record in the file */
  PrevAddress?: number;
/** Location of next record or 0 if this is the last record in the file */
  NextAddress?: number;
/** Time stamp of the record (not necessarily the creation time of the record) */
  TimeStamp?: string;
/** Whether the record is part of a transaction */
  InTransaction?: boolean;
/** Operating system process id for the process which created the journal record. This is calculated by taking the jobid stored in the journal record and looking up the corresponding process id in a trans */
  ProcessID?: string;
/** Internal jobid stored with each journal record in the journal file */
  JobID?: number;
/** Use RemoteSystemID if you're comparing records to ensure that two identical process IDs refer to the same real process/transaction. */
  RemoteSystemID?: number;
/** ECPSystemID is <i>RemoteSystemID</i> with the topbits masked off. <br>Use ECPSystemID if the only thing of interest is whether it came from an ECP client, etc. */
  ECPSystemID?: any;
/** If the record is not a set/kill record, the fields in this object will not be present */
  SetKill?: SetKillRecord;
/** If the record is not a vector set/kill record, the fields in this object will not be present */
  VectorSetKill?: VectorSetKillRecord;
}

export interface JournalSettings {
  AlternateDirectory?: string;
/** The destination for archiving journal files, given as the name of an archive target defined in the [Archives] CPF section. */
  ArchiveName?: string;
/** Number of backups before the journal files (or the archived copies) are automatically purged. */
  BackupsBeforePurge?: number;
  CurrentDirectory?: string;
/** Number of days before the journal files are purged. */
  DaysBeforePurge?: number;
/** Maximum size of each journal file in MB. */
  FileSizeLimit?: number;
/** Freeze the system if there is an error writing to the journal. */
  FreezeOnError?: boolean;
/** Prefixes journal file names with this string. */
  JournalFilePrefix?: string;
/** %cspSession global will be mapped to the TEMP database and not journaled. */
  JournalcspSession?: boolean;
/** Whether to purge journal files as soon as they are copied to archive. */
  PurgeArchived?: boolean;
/** Journal files should be compressed after they are created. */
  CompressFiles?: boolean;
/** Directory for the Write Image Journal file. */
  wijdir?: string;
/** When targwijsz is non-zero it is the desired size of the WIJ file in MB */
  targwijsz?: number;
}

export type KeyValueSecret = {   AllowedHosts?: string[];   RequireTLS?: boolean;   Usage?: "HTTP" | "SOAP" | "SQL"[];   Secret?: Record<string, any>; /** Any key-value pairs */  };

export interface LDAPConfig {
/** LDAP description */
  Description?: string;
/** List of additional LDAP attributes to return from LDAP Server. This property contains a list of additional LDAP User attributes for which you want values returned when a user authenticates himself via */
  LDAPAttributes?: any[];
/** LDAP attribute name where the "Comment" field is retrieved. */
  LDAPAttributeComment?: string;
/** LDAP attribute name where the "FullName" field is retrieved. */
  LDAPAttributeFullName?: string;
/** LDAP attribute name where the "Mail" field is retrieved. */
  LDAPAttributeMail?: string;
/** LDAP attribute name where the "Mobile" field is retrieved */
  LDAPAttributeMobile?: string;
/** LDAP attribute name where the "MobileProvider" field is retrieved */
  LDAPAttributeMobileProvider?: string;
/** LDAP attribute name where the "NameSpace" field is retrieved */
  LDAPAttributeNameSpace?: string;
/** LDAP attribute name where the "Routine" field is retrieved */
  LDAPAttributeRoutine?: string;
/** LDAP attribute name where the "Roles" field is retrieved */
  LDAPAttributeRoles?: string;
/** LDAP attribute name where the "Roles" field is retrieved */
  LDAPAttributeEscalationRoles?: string;
/** Specifies the point in the directory tree from which searches begin. This typically consists of domain components, such as DC=intersystems,DC=com */
  LDAPBaseDN?: string;
/** Specifies the point in the directory tree from which searches begin for Groups. This typically consists of domain components, such as DC=intersystems,DC=com */
  LDAPBaseDNForGroups?: string;
/** Specifies the location of the file containing any TLS/SSL certificates (in PEM format) being used to authenticate the server certificate (Unix Only). */
  LDAPCACertFile?: string;
/** Amount of time the client waits until a Server Down is returned. */
  LDAPClientTimeout?: number;
/** Flags for the LDAP connection. <br>Bit 0 - Active directory LDAP server<br>Bit 1 - Use SSL/TLS connection<br>Bit 2 - Unused<br>Bit 3 - Use Groups<br>Bit 4 - Use Nested Groups<br>Bit 5 - Use Universal  */
  LDAPFlags?: number;
/** Used to filter roles returned by the LDAP server for a user */
  LDAPGroupId?: string;
/** Host name of the LDAP server. An optional port may be appended to the host name separated by a ":" (name:port) if the LDAP server is using non standard ports. On a Windows client, if left blank, conne */
  LDAPHostNames?: any[];
/** Used to filter roles returned by the LDAP server for a user. */
  LDAPInstanceId?: string;
/** Organization name used for group naming */
  OrganizationId?: string;
/** Group Id used for group naming */
  GroupId?: string;
/** Instance Id used for group naming */
  InstanceId?: string;
/** Role Id used for group naming */
  RoleId?: string;
/** Escalation Role Id used for group naming */
  EscalationRoleId?: string;
/** Routine Id used for group naming */
  RoutineId?: string;
/** Namespace Id used for group naming */
  NamespaceId?: string;
/** Delimiter Id used for group naming */
  DelimiterId?: string;
/** Username of the LDAP search user with enough privileges to search the LDAP database (Windows only) */
  LDAPSearchUsername?: string;
/** Amount of time the LDAP server will wait for a client message before the connection is terminated */
  LDAPServerTimeout?: number;
/** A unique identifying element of each user in the LDAP database. For Active Directory LDAP servers, usually sAMAccountName. */
  LDAPUniqueDNIdentifier?: string;
}

export interface LDAPConfigurationListItem {
  Name?: string;
  Enabled?: boolean;
  Description?: string;
  LDAPCACertFile?: string;
}

export type LDAPConfigurationList = LDAPConfigurationListItem[];

export type LanguageServer = {   BindToIPAddress?: string; /** Which IP address, among the several IP addresses that the machine has, that allows incoming connections. The default is 127.0.0.1. Specify 0.0.0.0 to listen on all IP addresses local to the machine (1 */    ConnectionTimeout?: number; /** Number of seconds to wait for a connection to be established with the Gateway Server. */    InitializationTimeout?: number; /** Number of seconds to wait for a response during initialization of the Gateway Server. */    LogFile?: string; /** Fully qualified name of a file to log all communication between InterSystems IRIS and the Gateway Server. Usually this setting should be left blank, and used only for trouble-shooting. */    Port?: number; /** TCP port number for communication between the Gateway Server and the proxy classes in InterSystems IRIS. Required on creation, optional on updates. */    Resource?: string; /** The Resource name that controls access to this gateway.<br>If no resource is defined, then it is a public gateway which anyone can use. */    Type?: "Java" | "XSLT" | "JDBC" | "ODBC" | "ML" | "R" | ".NET" | "Python" | "Remote"; /** Type of the Object Gateway.  It can have one of the following values:<br>Type = "Remote" for remote connections<br>Type = "Java" for Gateway for Java<br>Type = "XSLT" for Gateway for XSLT<br>Type = "J */    UseSharedMemory?: boolean; /** Use shared memory for connection if available. */    SSLConfigurationServer?: string; /** Name of entry in Security.SSLConfigs class to be used for Server TLS/SSL */    SSLConfigurationClient?: string; /** Name of entry in Security.SSLConfigs class to be used for Client TLS/SSL */    VerifySSLHostName?: boolean; /** Should TLS/SSL client do Host Name Verification */    Custom?: ({  } | {   ClassPath?: string; /** CLASSPATH containing the files required to be passed as an argument when starting the JVM. The user should typically provide here the files containing the classes used via the Java-based Gateway. Ther */    JavaHome?: string; /** Location of the JVM (similar to the JAVA_HOME environment variable). It is used to find the target JVM and assemble the command to start the Gateway. <br>Note: If there is a default JVM on the machine */    JVMArgs?: string; /** Optional arguments to be passed to the Java Virtual Machine (JVM) to include when assembling the command to start the Gateway. <br>For example, you can specify system properties: "Dsystemvar=value" <b */  } | {   DotNetVersion?: string; /** Specified the .NET version to be used. Possible values are listed in VALIDNETVERSIONS and VALIDFRAMEWORKVERSIONS parameters of the class Config.Gateways. The default is N6.0. */    FilePath?: string; /** Location of the Gateway Server executable. It is used to find the target executable and assemble the command to start the Gateway on a local machine. <br>If this setting is not specified, the default  */    Exec32?: boolean; /** On 64-bit platforms, indicates if the Object Gateway server is to be executed as 32-bit (default) or 64-bit.<br>(This property applies only to .NET Gateways and to 64-bit platforms.) */  } | {   PythonOptions?: string; /** Optional Python options to be passed to the Python interpreter to include when assembling the command to start the Gateway. <br>(This property applies only to Python Gateways.) */    PythonPath?: string; /** Location of the Python Executable Path.  It is used to find the target Python interpreter and get the command to start the Gateway. <br>Note: If there is a default Python interpreter on the machine th */  } | {   Address?: string; /** Server Address<br>(This property applies only to Remote Gateways.). Required. */  }); };

export type LanguageServerActivityList = {   ID?: number;   DateTime?: string;   RecordType?: "Debug" | "Info" | "Warning" | "Error";   Job?: number;   Text?: string; }[];

export type LanguageServerList = {   Name?: string;   Port?: number;   Type?: "Java" | "XSLT" | "JDBC" | "ODBC" | "ML" | "R" | ".NET" | "Python" | "Remote"; }[];

export interface LicenseServer {
/** IP Address of the license server. Required on creation, optional on updates. */
  Address?: string;
/** Port of the license server. Required on creation, optional on updates. */
  Port?: number;
/** Directory used to load license keys for distribution. At startup of a local License Server, the system will attempt to load license keys from all *.key files in this directory. These keys can then be  */
  KeyDirectory?: string;
}

export type LicenseServerList = (LicenseServer) & ({   Name?: string; })[];

export type LicenseUsage = {   UsageByProcess?: {   PID?: number; /** Operating system Process Identifier */    Process?: "System" | "User" | "CSP" | "Diagnostic" | "Server" | "Pending";   LID?: string; /** License Login UserId for this process */    Type?: "User" | "CSP" | "Mixed" | "Grace"; /** License login type */    Con?: number; /** Number of connections to this instance by the user represented by LID */    MaxCon?: number; /** Max number of concurrent connections to this instance by the user */    CSPCon?: number; /** Number of CSP sessions open to this instance by the user */    LU?: number; /** The number of License Units consumed on this InterSystems IRIS instance by the user represented by the UserId */    Active?: number; /** The time in seconds the UserId has been logged in to this InterSystems IRIS instance */    Grace?: number; /** The amount of time this license unit will remain in the grace period if all connections were closed immediately */  }[];   UsageByUser?: {   UserId?: string;   Type?: "User" | "CSP" | "Mixed" | "Grace";   Connects?: number; /** Number of connection to this instance by the user */    MaxCon?: number; /** Max number of concurrent connections to this instance by the user */    CSPCon?: number; /** Number of CSP sessions open to this instance by the user */    LU?: number; /** Number of license units consumed on this instance by the user */    Active?: number; /** Time in seconds that the user has been logged in */    Grace?: number; /** Amount of time this license unit will remain in the grace period if all connections were closed immediately */  }[];   Summary?: {   LicenseUnitUse?: string;   Local?: string;   Distributed?: string; }[];   ConnectionList?: {   UserId?: string;   LicenseUnits?: string; /** The number of license units consumed.  This can be a number, or the string "shr", indicating that the connection shares a license unit with another connection by the same License UserId */    Connections?: string; /** The number of connections the UserId entity has made to the InterSystems IRIS server. */    ServerIP?: string; /** The address of the InterSystems IRIS server to which the connection was made */    Instance?: string; /** The name of the InterSystems IRIS instance to which the connection was made */  }[]; };

export type Licensing = {   LicenseLimit?: number; /** Maximum allowed license units for this system. */    LicenseUse?: (string | number); /** License usage as a percentage of available license units, or "" if there is no license limit */    LicenseUseHigh?: (number | string); /** Highest license usage as a percentage of available license units, or "" if there is no license limit */  };

export interface LocalDatabase {
/** Database is configured to be mounted in cluster mode.<br>If this property is set then this database has to be mounted explicitly. */
  ClusterMountMode?: boolean;
/** Size in MB to Expand by. <br>0 - Use system defaults (recommended) */
  ExpansionSize?: number;
/** Maximum size in MB, 0=unlimited (recommended). */
  MaxSize?: number;
/** Default collation for new globals. */
  NewGlobalCollation?: number;
/** Default Keep value for New globals. */
  NewGlobalIsKeep?: boolean;
/** If expansion creates a new volume as described in <i>NewVolumeThreshold</i>, it will be created in this directory. Defaults to <i>Directory</i> (the same directory as IRIS.DAT) and if this property is */
  NewVolumeDirectory?: string;
/** If 0, expansion of this database will never create a new volume. If non-zero, when the current last volume expands past this size in MB, a new database volume will be created instead. */
  NewVolumeThreshold?: number;
/** Journal setting for database, */
  GlobalJournalState?: boolean;
/** Database attribute in label says Read Only. */
  ReadOnly?: boolean;
/** Resource name for the database. */
  ResourceName?: string;
}

export interface LocalDatabaseList {
  Directory?: string;
/** Max size in MB. Could be "Unlimited" */
  MaxSize?: string;
/** Size in MB */
  Size?: number;
  Status?: string;
  Resource?: string;
  Encrypted?: boolean;
  Mirrored?: boolean;
  SFN?: number;
  EncryptionKeyID?: string;
  EncryptionVersion?: string;
}

/** One volume file of a local database (`GET /v2/database-dir/volumes`). */
export interface VolumeFile {
  VolumeNumber?: number;
  VolumeDirectory?: string;
  File?: string;
  /** Size in MB. */
  Size?: number;
  VolumeDirectoryTotalSize?: number;
  /** Free space on the disk hosting this volume (MB). */
  DiskFree?: number | string;
}

/**
 * Result of the async `POST /v2/database-dir/info` task (arrives as the
 * `Result` of the `GET /v2/async-result?id=...` response).
 */
export interface DatabaseDirInfo {
  /** Current size in MB. */
  Size?: number;
  ExpansionSize?: number;
  /** Max size in MB, 0=unlimited. */
  MaxSize?: number;
  ReadOnlyReason?: string;
  EncryptionKeyID?: string;
  /** Block size in bytes. */
  BlockSize?: number;
  Blocks?: number;
  /** Free space at the end of the file, MB. */
  AvailableSpace?: number;
  /** Free space on the hosting disk (formatted). */
  DiskFree?: string;
  EndFree?: number;
  LastExpansionTime?: string;
  MirrorSetName?: string;
  MirrorDBName?: string;
  SFN?: number;
  Mirrored?: boolean;
  Encrypted?: boolean;
  /** True when the file is at its maximum size. */
  Full?: boolean;
  Mounted?: boolean;
  MirrorFailoverDB?: boolean;
}

/** Request body of `POST /v2/database-dir/integrity-check`. */
export interface IntegrityCheckRequest {
  Databases?: { Directory: string; Globals?: string[] }[];
  MaxProcesses?: number;
  PartialCheck?: boolean;
}

export interface Lock {
/** Process id holding the lock. */
  Pid?: number;
/** Number of modes held. */
  ModeCount?: number;
/** Lock reference (global name). */
  Reference?: string;
/** Database of the lock. */
  Directory?: string;
/** System flag. */
  System?: boolean;
/** Whether the lock is removable. */
  Removable?: boolean;
/** The id used to release the lock (DELETE /v2/lock?id=DeleteID). */
  DeleteID?: string;
/** Whether the lock can be examined. */
  CanBeExamined?: boolean;
/** Remote owner (if any). */
  RemoteOwner?: string;
/** Routine info for the holder. */
  RoutineInfo?: string;
/** OS user name of the holder. */
  OSUserName?: string;
}

export type LockList = Lock[];

export interface LoginRequest {
/** Username for authentication */
  user?: string;
/** Password for authentication */
  password: string;
/** A valid escalation role */
  role?: string;
}

export interface LoginResponse {
  result?: {   access_token?: string; /** Short-lived JWT access token for API authentication */    refresh_token?: string; /** Long-lived refresh token used to obtain new access tokens */    sub?: string;   iat?: number; /** Issued at time */    exp?: number; /** Expiration time */  };
}

export type MFTConnection = {   Service?: "Box" | "Dropbox" | "Kiteworks"; /** Service is the name of the service that is accessed by this connection. Required on creation, optional on updates. */    URL?: string; /** URL is the base URL for REST access to this service including the final /. URL will default to the base URL for the remote file management service that is provided by the vendor. URL may be modified f */    SSLConfiguration?: string; /** SSLConfiguration is the name of the SSL Configuration to be used to communicate with the file management API. Required on creation, optional on updates. */    Username?: string; /** Username is the name of the user on whose behalf the file access will take place. Required on creation, optional on updates. */    ApplicationName?: string; /** ApplicationName is the OAuth2 application name associated with this connection. The ConnectionId property will be used as the session id for the specific access token. Required on creation, optional o */  };

export interface MFTConnectionListItem {
  Name?: string;
  Service?: string;
  IsAuthorized?: string;
}

export type MFTConnectionList = MFTConnectionListItem[];

export interface MainDashboardStats {
  Performance?: Performance;
  ECP?: ECP;
  Status?: SystemStatus;
  SystemUsage?: SystemUsage;
  Alerts?: Alerts;
  Licensing?: Licensing;
  UpcomingTasks?: UpcomingTask[];
}

export interface MapGlobal {
/** Default collation of the global */
  Collation?: number;
/** Database to map global to. Required on creation, optional on updates. */
  Database?: string;
/** Database to map global lock to */
  LockDatabase?: string;
}

export interface MapPackage {
/** Database to map Package to. Required on creation, optional on updates. */
  Database?: string;
}

export interface MapRoutine {
/** Database to map routine to. Required on creation, optional on updates. */
  Database?: string;
}

export interface Namespace {
/** Default database for globals. Required on creation, optional on updates. */
  Globals?: string;
/** Default database for routines. Required on creation, optional on updates. */
  Routines?: string;
/** Default database for temporary globals. */
  TempGlobals?: string;
}

export interface NamespaceList {

}

export interface OAuth2AuthorizationServerList {

}

export type OAuth2Client = {   OAuth2ServerDefinition?: string; /** Id of the corresponding Server Definition */    Enabled?: boolean; /** True if client application is enabled. Chosen by user during configuration. */    Description?: string; /** Description of the application. Chosen by user during configuration. */    ClientType?: "public" | "confidential" | "resource"; /** The type of client configuration:<br>public - a public client.  See RFC 6749<br>confidential - a confidential client.  See RFC 6749<br>resource - a resource server which is not also a client. Chosen b */    SSLConfiguration?: string; /** The name of the activated TLS/SSL configuration to use for authorization server requests. Chosen by user during configuration. Required on creation, optional on updates. */    RedirectionEndpoint?: string; /** The endpoint object for the URL to be used by the authorization server to return the response to an authorization request. Required if ClientType is public or confidential. Chosen by user during confi */    DefaultScope?: string; /** The default scope, as a blank separated list, for access token requests. Chosen by user during configuration. */    JWTAudience?: string; /** Defines the value to use for the aud claim in tokens generated for private_key_jwt and client_secret_jwt authentication methods, as well as for the JWT Authorization grant type. For new configurations */    ClientCredentials?: string; /** ClientCredentials is the alias of the %SYS.X509Credentials object which contains the client's certificate and private key. */    Metadata?: OAuth2ClientMetadata; };

export type OAuth2ClientMetadata = {   registration_client_uri?: string; /** Used only for OpenID Connect Dynamic Registration Response. OPTIONAL. Location of the OAuth2Client Configuration Endpoint where the Registration Access Token can be used to perform subsequent operatio */    redirect_uris?: any[]; /** REQUIRED. An array of Redirection URI values used by the OAuth2Client. One of these registered Redirection URI values MUST exactly match the redirect_uri parameter value used in each Authorization Req */    response_types?: any[]; /** OPTIONAL. An array of the OAuth 2.0 response_type values that the OAuth2Client is declaring that it will restrict itself to using. If omitted, the default is that the OAuth2Client will use only the co */    grant_types?: any[]; /** OPTIONAL. An array of the OAuth 2.0 Grant Types that the OAuth2Client is declaring that it will restrict itself to using. The Grant Type values used by OpenID Connect are:<br>authorization_code: The A */    application_type?: "native" | "web"; /** OPTIONAL. Kind of the application. The default, if omitted, is web. The defined values are native or web. Web Clients using the OAuth Implicit Grant Type MUST only register URLs using the https scheme */    contacts?: string[]; /** OPTIONAL. An array of email addresses of people responsible for this OAuth2Client. This might be used by some providers to enable a Web user interface to modify the OAuth2Client information. */    client_name?: string; /** OPTIONAL. Name of the OAuth2Client to be presented to the EndUser. */    logo_uri?: string; /** OPTIONAL. URL that references a logo for the OAuth2Client application. If present, the server SHOULD display this image to the EndUser during approval. The value of this field MUST point to a valid im */    client_uri?: string; /** OPTIONAL. URL of the home page of the OAuth2Client. The value of this field MUST point to a valid Web page. If present, the server SHOULD display this URL to the EndUser in a followable fashion. */    policy_uri?: string; /** OPTIONAL. URL that the Relying Party OAuth2Client provides to the EndUser to read about the how the profile data will be used. The value of this field MUST point to a valid web page. The OpenID Provid */    tos_uri?: string; /** OPTIONAL. URL that the Relying Party OAuth2Client provides to the EndUser to read about the Relying Party's terms of service. The value of this field MUST point to a valid web page. The OpenID Provide */    id_token_signed_response_alg?: string; /** OPTIONAL. JWS alg algorithm REQUIRED for signing the ID Token issued to this OAuth2Client. The value none MUST NOT be used as the ID Token alg value unless the OAuth2Client uses only Response Types th */    id_token_encrypted_response_alg?: string; /** OPTIONAL. JWE alg algorithm REQUIRED for encrypting the ID Token issued to this OAuth2Client. If this is requested, the response will be signed then encrypted, with the result being a Nested JWT. The  */    id_token_encrypted_response_enc?: string; /** OPTIONAL. JWE enc algorithm REQUIRED for encrypting the ID Token issued to this OAuth2Client. If id_token_encrypted_response_alg is specified, the default for this value is A128CBC-HS256. When id_toke */    userinfo_signed_response_alg?: string; /** OPTIONAL. JWS alg algorithm REQUIRED for signing UserInfo Responses. If this is specified, the response will be JWT serialized, and signed using JWS. The default, if omitted, is for the UserInfo Respo */    userinfo_encrypted_response_alg?: string; /** OPTIONAL. JWE alg algorithm REQUIRED for encrypting UserInfo Responses. If both signing and encryption are requested, the response will be signed then encrypted, with the result being a Nested JWT. Th */    userinfo_encrypted_response_enc?: string; /** OPTIONAL. JWE enc algorithm REQUIRED for encrypting UserInfo Responses. If userinfo_encrypted_response_enc is specified, the default for this value is A128CBC-HS256. When userinfo_encrypted_response_e */    access_token_signed_response_alg?: string; /** ADDITIONAL. JWS alg algorithm REQUIRED for signing a JWT access token. The default, if omitted, is for the introspection endpoint Response to not be signed. */    access_token_encrypted_response_alg?: string; /** ADDITIONAL. JWE alg algorithm REQUIRED for encrypting a JWT access token. If both signing and encryption are requested, the response will be signed then encrypted, with the result being a Nested JWT.  */    access_token_encrypted_response_enc?: string; /** ADDITIONAL. JWE enc algorithm REQUIRED for encrypting a JWT access token. If access_token_encrypted_response_alg is specified, the default for this value is A128CBC-HS256. When access_token_encrypted_ */    request_object_signing_alg?: string; /** OPTIONAL. JWS alg algorithm that MUST be used for signing Request Objects sent to the OP. All Request Objects from this OAuth2Client MUST be rejected, if not signed with this algorithm. Request Object */    request_object_encryption_alg?: string; /** OPTIONAL. JWE alg algorithm the RP is declaring that it may use for encrypting Request Objects sent to the OP. This parameter SHOULD be included when symmetric encryption will be used, since this sign */    request_object_encryption_enc?: string; /** OPTIONAL. JWE enc algorithm the RP is declaring that it may use for encrypting Request Objects sent to the OP. If request_object_encryption_alg is specified, the default for this value is A128CBC-HS25 */    token_endpoint_auth_method?: "ClientSecret_post" | "ClientSecret_basic" | "ClientSecret_jwt" | "private_key_jwt" | "none"; /** OPTIONAL. Requested OAuth2Client Authentication method for the Token Endpoint. The options are ClientSecret_post, ClientSecret_basic, ClientSecret_jwt, private_key_jwt, and none, as described in Secti */    token_endpoint_auth_signing_alg?: string; /** OPTIONAL. JWS algorithm that MUST be used for signing the JWT used to authenticate the OAuth2Client at the Token Endpoint for the private_key_jwt and ClientSecret_jwt authentication methods. This JWS  */    default_max_age?: number; /** OPTIONAL. Default Maximum Authentication Age. Specifies that the EndUser MUST be actively authenticated if the EndUser was authenticated longer ago than the specified number of seconds. The max_age re */    frontchannel_logout_uri?: string; /** OPTIONAL. URL that will cause the client to log itself out when rendered in an iframe by the OpenID Provider. This URL SHOULD use the https scheme and MAY contain port, path, and query parameter compo */    frontchannel_logout_session_required?: boolean; /** OPTIONAL. Boolean value specifying whether the client requires that iss (issuer) and sid (session ID) query parameters be included to identify the client session with the OpenID Provider when the fron */  };

export interface OAuth2ClientsUsingServer {

}

export type OAuth2ResourceServer = {   Enabled?: boolean; /** True if this configuration is enabled. */    Description?: string; /** Description of the application. */    IssuerEndpoint?: string; /** IssuerEndpoint of the ServerDefinition property */    ScopeRequiredToConnect?: string; /** If specified, this scope must be included in the Access token claims. */    Audiences?: string[]; /** A list of valid audiences. The aud claim must match one of the values in this list. */    AccessTokenIsJWT?: boolean; /** If true, the access token is expected to be a JWT. */    AlwaysCallIntrospection?: boolean; /** If true and AccessTokenIsJWT, then we will call the introspection endpoint after validating the token. This is useful if it is necessary to determine if the token has been revoked, or if the claims ha */    ClientId?: string; /** If configured, this value will be used to authenticate to the Authorization Server when calling the introspection endpoint. */    IntrospectionAuthMethod?: "client_secret_post" | "client_secret_basic" | "none"; /** This value specifies how to authenticate to the Authorization Server when calling the introspection endpoint. Valid values are: "client_secret_post", "client_secret_basic", "none". The ClientId and Cl */    UseOIDC?: boolean; /** If true and the "openid" scope is included in the access token, then we will call the userinfo endpoint. */    Authenticator?: {   Namespace?: string; /** Required. */    Implementation?: string; /** Required. */  }; /** Implementation class used to determine the username and role mapping from the token claims. This object can contain other properties, corresponding to the properties of the specified class. */  };

export interface OAuth2ResourceServerList {

}

export interface OAuth2ResourceServerMapping {
/** The name of the OAuth2.ResourceServer to use for this Service and Key combination. Required. */
  Resource?: string;
}

export interface OAuth2ResourceServerMappingList {

}

export type OAuth2ServerClient = {   Name?: string; /** The name of this client. When using dynamic registration the initial value will be the value of the "client_name" metadata field. */    RedirectURL?: any[]; /** RedirectURL is the expected redirect URL for this client. */    LaunchURL?: string; /** LaunchURL is the URL used to launch this client. LaunchURL may be used in some circumstances to identify the client and as the value of the aud claim. */    DefaultScope?: string; /** A blank separated list containing the default for access token scope if scope is not specified in the access token request. */    Description?: string; /** Description of the client.<br>Chosen by user during configuration. */    ClientType?: "public" | "confidential" | "resource"; /** The type of client configuration:<br>public - a public client.  See RFC 6749<br>confidential - a confidential client.  See RFC 6749<br>resource - a resource server which is not also a client. Chosen b */    ClientCredentials?: string; /** Alias of the %SYS.X509Credentials object which contains the client's certificate. */    Metadata?: OAuth2ClientMetadata; };

export interface OAuth2ServerClientList {

}

export interface OAuth2ServerConfiguration {
/** IssuerEndpoint is the endpoint for this authorization server. Required on creation, optional on updates. */
  IssuerEndpoint?: string;
/** Description is a human readable description of this authorization server. Required on creation, optional on updates. */
  Description?: string;
/** AccessTokenInterval is the interval in seconds after which an access token issued by this server will expire. The default is 3600 seconds. Required on creation, optional on updates. */
  AccessTokenInterval?: number;
/** AuthorizationCodeInterval is the interval in seconds after which an authorization code issued by this server will expire. The default is 60 seconds. Required on creation, optional on updates. */
  AuthorizationCodeInterval?: number;
/** RefreshTokenInterval is the interval in seconds after which a refresh token issued by this server will expire. The default is 24 hours = 86400 seconds. Required on creation, optional on updates. */
  RefreshTokenInterval?: number;
/** SessionInterval is the interval in seconds after which a user session will be automatically terminated. The value 0 means the session will not be automatically terminated. The default is 24 hours = 86 */
  SessionInterval?: number;
/** ClientSecretInterval is the interval in seconds after which a client secret will expire. The default value of 0 means the session will not be automatically terminated. Required on creation, optional o */
  ClientSecretInterval?: number;
/** SupportedScopes is an array which specifies all scopes supported by this Authorization Server. Required on creation, optional on updates. */
  SupportedScopes?: {   Scope?: string;   Description?: string; }[];
/** DefaultScope is a blank separated list containing the default for access token scope if scope is not specified in the access token request or in the client configuration. Required on creation, optiona */
  DefaultScope?: string;
/** If AllowUnsupportedScope is true, then unsupported scope values will be ignored. Otherwise, an error will be returned. Required on creation, optional on updates. */
  AllowUnsupportedScope?: boolean;
/** ReturnRefreshToken defines the conditions under which a refresh token is returned along with the access token. This property is a string of multiple condition characters which are OR'ed.<br>"" means o */
  ReturnRefreshToken?: string;
/** If SupportSession is true, then OAuth 2.0 user sessions will be supported using the specified SessionClass. Required on creation, optional on updates. */
  SupportSession?: boolean;
/** If AudRequired is true, then an authorization code and implicit requests require the aud property. Required on creation, optional on updates. */
  AudRequired?: boolean;
/** If AllowPublicClientRefresh is true, then a clientSecret will NOT be required to process refresh tokens. Required on creation, optional on updates. */
  AllowPublicClientRefresh?: boolean;
/** If ForcePKCEForPublicClients is true, then authorization and token requests from public clients MUST adhere to the Proof Key for Code Exchange (PKCE) specification. Required on creation, optional on u */
  ForcePKCEForPublicClients?: boolean;
/** If ForcePKCEForConfidentialClients is true, then authorization and token requests from confidential clients MUST adhere to the Proof Key for Code Exchange (PKCE) specification. Required on creation, o */
  ForcePKCEForConfidentialClients?: boolean;
/** CustomizationRoles is a list of roles that are set for any call to user supplied customization code. Required on creation, optional on updates. */
  CustomizationRoles?: any[];
/** CustomizationNamespace is the namespace where the customization code is to be run. Required on creation, optional on updates. */
  CustomizationNamespace?: string;
/** AuthenticateClass is the name of a subclass of %OAuth2.Server.Authenticate which will be used to allow override of the DirectLogin, DisplayLogin, and DisplayPermissions methods during user authorizati */
  AuthenticateClass?: string;
/** SessionClass is the name of a class with the same signatures as OAuth2.Server.Session which includes GetUser, Login and Logout methods. These methods maintain an OAuth 2.0 session using any appropriat */
  SessionClass?: string;
/** ValidateUserClass is the name of a class with the same signatures as %OAuth2.Server.Validate which may override the ValidateUser method which validates a user and associates a set of properties with t */
  ValidateUserClass?: string;
/** GenerateTokenClass is the name of a class with the same signatures as %OAuth2.Server.Generate which overrides the GenerateToken method. The GenerateToken method must generate an opaque token consistin */
  GenerateTokenClass?: string;
/** RevokeTokenClass is the name of a class with the same signatures as %OAuth2.Server.Revoke which overrides the OnRevokeToken method. Any custom handling on token revocation can be done in this method.  */
  RevokeTokenClass?: string;
/** ServerCredentials is the alias of the %SYS.X509Credentials object which contains the authorization server's certificate and private key. Required on creation, optional on updates. */
  ServerCredentials?: string;
/** SigningAlgorithm specifies the default signing algorithm used to create JWSs or "" if JWTs are not to be signed. SigningAlgorithm is used for any client specific algorithm which is not specified. See  */
  SigningAlgorithm?: string;
/** EncryptionAlgorithm specifies the default encryption algorithm used to create JWEs or "" if JWTs are not to be encrypted. EncryptionAlgorithm is used for any client specific algorithm which is not spe */
  EncryptionAlgorithm?: string;
/** KeyAlgorithm specifies the default key management algorithm used to create JWEs or "" if JWTs are not to be encrypted. KeyAlgorithm is used for any client specific algorithm which is not specified. Se */
  KeyAlgorithm?: string;
/** The name of the activated TLS/SSL configuration to use loading a request object. Chosen by user during configuration. Required on creation, optional on updates. */
  SSLConfiguration?: string;
/** Required on creation, optional on updates. */
  Metadata?: OAuth2ServerMetadata;
}

export interface OAuth2ServerDefinition {
/** The endpoint URL to be used to identify the authorization server. Required for all ClientTypes. Required on creation, optional on updates. */
  IssuerEndpoint?: string;
/** The name of the activated TLS/SSL configuration to use for authorization server Discovery requests. Chosen by user during configuration. Required on creation, optional on updates. */
  SSLConfiguration?: string;
/** ServerCredentials is the alias of the %SYS.X509Credentials object which contains the server's certificate. */
  ServerCredentials?: string;
  Metadata?: OAuth2ServerMetadata;
}

export type OAuth2ServerMetadata = {   issuer?: string; /** REQUIRED. URL using the https scheme with no query or fragment component that the OP asserts as its Issuer Identifier. This also MUST be identical to the iss Claim value in ID Tokens issued from this  */    authorization_endpoint?: string; /** REQUIRED. URL of the OP's OAuth 2.0 Authorization Endpoint. */    token_endpoint?: string; /** URL of the OP's OAuth 2.0 Token Endpoint. This is REQUIRED unless only the Implicit Flow is used. */    userinfo_endpoint?: string; /** RECOMMENDED. URL of the OP's UserInfo Endpoint. This URL MUST use the https scheme and MAY contain port, path, and query parameter components. */    revocation_endpoint?: string; /** ADDITIONAL. OAuth 2.0 revocation endpoint as defined by RFC 7009 */    introspection_endpoint?: string; /** ADDITIONAL. OAuth 2.0 introspection endpoint as defined by RFC 7662 */    jwks_uri?: string; /** REQUIRED. URL of the OP's JSON Web Key Set document. This contains the signing key(s) the RP uses to validate signatures from the OP. The JWK Set MAY also contain the Server's encryption key(s), which */    registration_endpoint?: string; /** RECOMMENDED. URL of the OP's Dynamic Client Registration Endpoint. */    end_session_endpoint?: string; /** REQUIRED. URL at the OP to which an RP can perform a redirect to request that the End-User be logged out at the OP. */    scopes_supported?: string[]; /** RECOMMENDED. An array of the RFC6749 scope values that this server supports. The server MUST support the openid scope value. Servers MAY choose not to advertise some supported scope values even when t */    response_types_supported?: string[]; /** REQUIRED. An array of the OAuth 2.0 response_type values that this OP supports. Dynamic OpenID Providers MUST support the code, id_token, and the token id_token Response Type values. */    response_modes_supported?: string[]; /** OPTIONAL. An array of the OAuth 2.0 response_mode values that this OP supports. If omitted, the default for Dynamic OpenID Providers is ["query", "fragment"]. */    code_challenge_methods_supported?: string[]; /** OPTIONAL. JSON array containing a list of Proof Key for Code Exchange (PKCE) [RFC7636] code challenge methods supported by this authorization server. Code challenge method values are used in the "code */    grant_types_supported?: string[]; /** OPTIONAL. An array of the OAuth 2.0 Grant Type values that this OP supports. Dynamic OpenID Providers MUST support the authorization_code and implicit Grant Type values and MAY support other Grant Typ */    acr_values_supported?: string[]; /** OPTIONAL. An array of the Authentication Context Class References that this OP supports.<br>This property is currently not supported and is ignored during registration. */    subject_types_supported?: string[]; /** REQUIRED. An array of the Subject Identifier types that this OP supports. Valid types include pairwise and public.<br>This property is currently not supported and is ignored during registration. */    id_token_signing_alg_values_supported?: string[]; /** REQUIRED. An array of the JWS signing algorithms (alg values) supported by the OP for the ID Token to encode the Claims in a JWT. The algorithm RS256 MUST be included. The value none MAY be supported, */    id_token_encryption_alg_values_supported?: string[]; /** OPTIONAL. An array of the JWE encryption algorithms (alg values) supported by the OP for the ID Token to encode the Claims in a JWT. */    id_token_encryption_enc_values_supported?: string[]; /** OPTIONAL. An array of the JWE encryption algorithms (enc values) supported by the OP for the ID Token to encode the Claims in a JWT. */    userinfo_signing_alg_values_supported?: string[]; /** OPTIONAL. An array of the JWS signing algorithms (alg values) supported by the UserInfo Endpoint to encode the Claims in a JWT. The value none MAY be included. */    userinfo_encryption_alg_values_supported?: string[]; /** OPTIONAL. An array of the JWE encryption algorithms (alg values) supported by the UserInfo Endpoint to encode the Claims in a JWT. */    userinfo_encryption_enc_values_supported?: string[]; /** OPTIONAL. An array of the JWE encryption algorithms (enc values) supported by the UserInfo Endpoint to encode the Claims in a JWT. */    access_token_signing_alg_values_supported?: string[]; /** ADDITIONAL. An array of the JWS signing algorithms (alg values) supported for access token returned as a JWT to encode the Claims in a JWT. The value none MAY be included. */    access_token_encryption_alg_values_supported?: string[]; /** ADDITIONAL. An array of the JWE encryption algorithms (alg values) supported for access token returned as a JWT to encode the Claims in a JWT. */    access_token_encryption_enc_values_supported?: string[]; /** ADDITIONAL. An array of the JWE encryption algorithms (enc values) supported for access token returned as a JWT to encode the Claims in a JWT. */    request_object_signing_alg_values_supported?: string[]; /** OPTIONAL. An array of the JWS signing algorithms (alg values) supported by the OP for Request Objects, which are described in Section 6.1 of OpenID Connect Core. These algorithms are used both when th */    request_object_encryption_alg_values_supported?: string[]; /** OPTIONAL. An array of the JWE encryption algorithms (alg values) supported by the OP for Request Objects. These algorithms are used both when the Request Object is passed by value and when it is passe */    request_object_encryption_enc_values_supported?: string[]; /** OPTIONAL. An array of the JWE encryption algorithms (enc values) supported by the OP for Request Objects. These algorithms are used both when the Request Object is passed by value and when it is passe */    token_endpoint_auth_methods_supported?: "client_secret_post" | "client_secret_basic" | "client_secret_jwt" | "private_key_jwt"[]; /** OPTIONAL. An array of Client Authentication methods supported by this Token Endpoint. The options are client_secret_post, client_secret_basic, client_secret_jwt, and private_key_jwt, as described in S */    token_endpoint_auth_signing_alg_values_supported?: string[]; /** OPTIONAL. An array of the JWS signing algorithms (alg values) supported by the Token Endpoint for the signature on the JWT used to authenticate the Client at the Token Endpoint for the private_key_jwt */    display_values_supported?: string[]; /** OPTIONAL. An array of the display parameter values that the OpenID Provider supports. These values are described in Section 3.1.2.1 of OpenID Connect Core.<br>This property is currently not supported  */    claim_types_supported?: string[]; /** OPTIONAL. An array of the Claim Types that the OpenID Provider supports. These Claim Types are described in Section 5.6 of OpenID Connect Core. Values defined by this specification are normal, aggrega */    claims_supported?: string[]; /** RECOMMENDED. An array of the Claim Names of the Claims that the OpenID Provider MAY be able to supply values for. Note that for privacy or other reasons, this might not be an exhaustive list. */    claims_locales_supported?: string[]; /** OPTIONAL. Languages and scripts supported for values in Claims being returned as an array of RFC5646 language tag values. Not all languages and scripts are necessarily supported for all Claim values.< */    ui_locales_supported?: string[]; /** OPTIONAL. Languages and scripts supported for the user interface, represented as an array of RFC5646 language tag values.<br>This property is currently not supported and is ignored during registration */    claims_parameter_supported?: boolean; /** OPTIONAL. Boolean value specifying whether the OP supports use of the claims parameter, with true indicating support. If omitted, the default value is false. */    request_parameter_supported?: boolean; /** OPTIONAL. Boolean value specifying whether the OP supports use of the request parameter, with true indicating support. If omitted, the default value is false. */    request_uri_parameter_supported?: boolean; /** OPTIONAL. Boolean value specifying whether the OP supports use of the request_uri parameter, with true indicating support. If omitted, the default value is true. */    require_request_uri_registration?: boolean; /** OPTIONAL. Boolean value specifying whether the OP requires any request_uri values used to be preregistered using the request_uris registration parameter. Preregistration is REQUIRED when the value is  */    service_documentation?: string; /** OPTIONAL. URL of a page containing human readable information that developers might want or need to know when using the OpenID Provider. In particular, if the OpenID Provider does not support Dynamic  */    op_policy_uri?: string; /** OPTIONAL. URL that the OpenID Provider provides to the person registering the Client to read about the OP's requirements on how the Relying Party can use the data provided by the OP. The registration  */    op_tos_uri?: string; /** OPTIONAL. URL that the OpenID Provider provides to the person registering the Client to read about OpenID Provider's terms of service. The registration process SHOULD display this URL to the person re */    frontchannel_logout_supported?: boolean; /** OPTIONAL. Boolean value specifying whether the OpenID Provider supports HTTP-based logout, with true indicating support. If omitted, the default value is false. */    frontchannel_logout_session_supported?: boolean; /** OPTIONAL. Boolean value specifying whether the OpenID Provider can pass iss (issuer) and sid (session ID) query parameters to identify the client's session with the OP when frontchannel_logout_uri is  */  };

export interface PackageMappingList {

}

export interface PercentClassAccessList {

}

export interface Performance {
/** Most recently measured number of Global references per second. */
  GlobalRefsPerSecond?: number;
/** Number of Global references since system startup. */
  GlobalRefs?: number;
/** Number of Global Sets and Kills since system startup. */
  GlobalSetKill?: number;
/** Number of routine loads and saves since system startup. */
  RoutineRefs?: number;
/** Number of logical block requests since system startup. */
  LogicalRequests?: number;
/** Number of physical block read operations since system startup. */
  DiskReads?: number;
/** Number of physical block write operations since system startup. */
  DiskWrites?: number;
/** Most recently measured cache efficiency (Global references / (physical reads + writes)). */
  CacheEfficiency?: number;
}

export type PrivilegedRoutineApplication = {   Description?: string; /** Application description. */    Enabled?: boolean; /** Application is enabled. */    MatchRoles?: {   MatchRole?: string; /** If blank, it means the TargetRoles are assigned to any user entering the application */    TargetRoles?: any[]; }[]; /** Mapping of MatchRole/TargetRoles pairs to assign to the application. */    Resource?: string; /** The Resource name that controls access to this application. If no resource is defined, then it is a public application which anyone can run. */    Routines?: {   RoutineOrClass?: string; /** Name of the routine/class */    Db?: string; /** Database containing the routine/class */    Type?: "Routine" | "Class"; }[]; /** List of Routines that can invoke this application */  };

export type PrivilegedRoutineApplicationList = {   Name?: string;   Namespace?: string;   NamespaceDefault?: boolean;   Enabled?: boolean;   Type?: "Class" | "Routine";   Resource?: string;   IsSystemApp?: boolean;   DispatchClass?: string; }[];

export interface Process {
/** Process can be suspended. Flag checked by JOBEXAM and Management Portal to see if a process can be suspended. */
  CanBeSuspended?: boolean;
/** Process can be terminated. Flag checked by JOBEXAM and Management Portal to see if a process can be terminated. */
  CanBeTerminated?: boolean;
/** Process can receive broadcast. Flag checked by JOBEXAM and Management Portal to see if a process can receive a broadcast. Usually this means they are attached to a terminal. */
  CanReceiveBroadcast?: boolean;
/** Executable name of the process on the client. The name of the Executable or DLL on the client which initiated the connection. It is passed down to the process as part of the initial connection message */
  ClientExecutableName?: string;
/** IP Address of client connected to the process. IP address of the client which initiated the connection. It is passed down to the process as part of the initial connection message. This property may be */
  ClientIPAddress?: string;
/** Node Name of the client connected to the process. Node name of the client which initiated the connection. It is passed down to the process as part of the initial connection message. This property may  */
  ClientNodeName?: string;
/** Number of Commands Executed. Total number of commands which the process has executed. */
  CommandsExecuted?: number;
/** CSP Session ID of client connected to process.<br>CSP session ID of the client which initiated the connection. It is passed down to the process as part of the initial connection message, and used to m */
  CSPSessionID?: string;
/** Current device that the process has open and is USEing via the USE command. */
  CurrentDevice?: string;
/** Current Line and Routine. Current line and routine that the process is executing. Returned in +number^routine format. This property requires a mailbox message to be sent to the process being examined. */
  CurrentLineAndRoutine?: string;
/** Current Source Line being executed. Current line of source code which is being executed by the process. If "", then the source code line is unavailable. This property requires a mailbox message to be  */
  CurrentSrcLine?: string;
/** Additional roles granted to the set of login roles */
  EscalatedRoles?: string[];
/** Number of Global References. Total number of global references the process has made. */
  GlobalReferences?: number;
/** Number of Global Updates. Total number of global updates (sets and kills) the process has made. */
  GlobalUpdates?: number;
/** Number of Physical Database Reads. Total number of times the process has fetched data from disk. */
  GlobalDiskReads?: number;
/** Number of Database Block Allocations. Total number of new database blocks the process has allocated. An indication of database growth. */
  GlobalBlocks?: number;
/** Total number of database blocks queued for writing by this process. */
  DataBlockWrites?: number;
/** In a transaction. If 0, the process is not in a transaction. If >0, the process has executed a tstart command, is in a transaction, and the value is the offset in the journal file where the transactio */
  InTransaction?: number;
/** Is a Ghost process. The process has been killed at the O/S level, and has not yet been cleaned up by the CLNDMN process. Until the process is cleaned, there may be outstanding locks or resources which */
  IsGhost?: number;
/** Job number in process table. Used as an index into the job table. */
  JobNumber?: number;
/** Job type. Number which tells what type of process it is. */
  JobType?: number;
/** Number of Journal Entries. Total number of journaled global updates the process has recorded. An indication of journal file growth. */
  JournalEntries?: number;
/** Last Global Reference. Last global reference that the process made. This property requires a mailbox message to be sent to the process being examined. */
  LastGlobalReference?: string;
/** User Id used for license. The User ID which took out the license for the process. */
  LicenseUserId?: string;
/** Location.<br>If a system process, will be the system processes name.<br>If a user process, will be the value of $g(^%IS(0,Job.CurrentDevice),"") */
  Location?: string;
/** Login roles. Roles a process has when it initially logs in */
  LoginRoles?: string[];
/** Maximum memory able to be used in KB ($ZS). Maximum amount of memory in KB that the process is allowed to use. This property requires a mailbox message to be sent to the process being examined. */
  MemoryAllocated?: number;
/** Memory used in KB ($ZS - ($S/1024)). Current amount of memory the process has used in KB. This property requires a mailbox message to be sent to the process being examined. */
  MemoryUsed?: number;
/** Peak memory allocated in KB. This property requires a mailbox message to be sent to the process being examined. */
  MemoryPeak?: number;
/** Namespace process is executing in. */
  NameSpace?: string;
/** List of open devices. List of devices which the process has opened. This property requires a mailbox message to be sent to the process being examined. */
  OpenDevices?: string[];
/** Operating system username of process. Username given to the process by the operating system when the process is created. When displayed, it is truncated to 16 characters. Note that the real O/S userna */
  OSUserName?: string;
/** Sum of system and user CPU Time in ms for process (no mailbox message) */
  CPUTime?: number;
/** Process ID of the parent job. Set to 0 if the process has no parent or if the parent exists outside of IRIS. */
  ParentPid?: number;
/** Process ID. Process ID ($J) given to the process by the O/S, decimal form on all platforms. */
  Pid?: number;
/** Number of private global database blocks. This property contains the # of database blocks currently allocated to store process private globals. */
  PrivateGlobalBlockCount?: number;
/** Number of Process Private Global References. Total number of private global references the process has made. */
  PrivateGlobalReferences?: number;
/** Number of Process Private Global Updates. Total number of private global updates (sets and kills) the process has made. */
  PrivateGlobalUpdates?: number;
/** External Process PID. Decimal value for Windows, Unix and Mac, hex for VMS. */
  PidExternal?: number;
/** Principal Device ($P). This property requires a mailbox message to be sent to the process being examined. */
  PrincipalDevice?: string;
/** Priority. Priority of the process at the O/S level. */
  Priority?: number;
/** $Roles. Roles a process currently has */
  Roles?: string[];
/** Routine currently executing. Name of the routine which the process is currently executing. */
  Routine?: string;
/** Process start time in UTC. */
  StartTimeUTC?: string;
/** Startup IP Address of client. IP address of the client as detected on the TCP channel by the server process. */
  StartupClientIPAddress?: string;
/** Startup Node Name of client. IP Node name of the client as detected on the TCP channel by the server process. */
  StartupClientNodeName?: string;
/** Current state of the process as determined by the processes state bits. The following are all the different states a process can be in. The process may also have a number of different flags within the */
  State?: string;
/** User defined information.<br>This is a user-defined property where the process can set any value into it up to 64 bytes long. The data in it is viewable in JOBEXAM. Note that the information can only  */
  UserInfo?: string;
/** $Username of process.<br>$Username of the process as set by the authentication method. */
  UserName?: string;
  Variables?: {   Name?: string;   Value?: string; }[];
}

export interface ProcessList {

}

export interface RSASecret {
/** Input only. The name of a file containing the PEM encoded certificate. */
  CertificateFile?: string;
/** Input only. The name of a file containing The PEM encoded public key. */
  PublicKeyFile?: string;
/** Input only. The name of a file containing The PEM encoded private key. This may be encrypted with <i>Password</i>. */
  PrivateKeyFile?: string;
/** Input only. If the private key contained in either <i>PrivateKey</i> or <i>PrivateKeyFile</i> is encrypted, this is the password to decrypt it. */
  Password?: string;
}

export interface Resource {
/** Description of the resource. Description cannot be modified if a system defined resource. Required on creation, optional on updates. */
  Description?: string;
/** Public permissions on the resource. Must be a string consisting only of 'R', 'W', and 'U'. Required on creation, optional on updates. */
  PublicPermission?: string;
}

export interface ResourceList {

}

export interface Role {
/** Description of the role. */
  Description?: string;
/** Roles assigned to the Role. */
  GrantedRoles?: string[];
  EscalationOnly?: boolean;
  Resources?: {   Name?: string;   Permissions?: string; }[];
}

export interface RoleList {

}

export type RoleOwnerList = {   Name?: string; /** Name of the user or role */    Type?: "User" | "Role" | "User (escalation)";   AdminOption?: boolean; }[];

export type RoutineMappingList = {   Name?: string;   Type?: "" | "MAC" | "INT" | "INC" | "OBJ";   Database?: string; }[];

export interface RoutinesStats {
/** Local Routine calls. The count of all routine calls where the routine is stored locally. */
  RtnCallsLocal?: number;
/** Local Routine loads/saves. The number of times that local routines were fetched from disk into buffers (or saved to disk). */
  RtnFetchLocal?: number;
/** Remote Routine calls. The count of all routine calls where the routine is stored remotely. */
  RtnCallsRemote?: number;
/** Routine commands. The count of all routine commands executed on the system. */
  RtnCommands?: number;
/** Routine not cached. The number of times processes were unable to directly access the routine in memory. An indicator of extra work in loading routines. */
  RtnNotCached?: number;
/** Remote Routine loads/saves. The number of times that remote routines were fetched from disk into buffers (or saved to disk). */
  RtnFetchRemote?: number;
}

export interface SQLAdminPrivilegeList {

}

export interface SQLColumnPrivilegeList {

}

export interface SQLPrivilegeList {

}

export interface SSLConfig {
/** Authorize a backup failover member to join a mirror.<br>Normally, mirroring with SSL requires the following steps:<br>1. Add primary to mirror 2. Add backup to mirror 3. Authorize backup on primary <b */
  AuthorizeCN?: boolean;
/** File containing X.509 certificate(s) of trusted Certificate Authorities.<br>Can be an absolute pathname, a pathname relative to the manager's directory, or a special value "%OSCertificateStore" for OS */
  CAFile?: string;
/** Directory containing file(s) with X.509 certificate(s) of trusted Certificate Authorities.<br>Can be an absolute pathname or a pathname relative to the manager's directory.<br>Clients:  Specify CAFile */
  CAPath?: string;
/** File containing this configuration's X.509 certificate.<br>Can be an absolute pathname or a pathname relative to the manager's directory. If not null, PrivateKeyFile must also be specified. */
  CertificateFile?: string;
/** List of enabled ciphersuites for TLSv1.2 and below.<br>By default, disable anonymous, unencrypted, export, and SSLv2 ciphersuites. */
  CipherList?: string[];
/** List of enabled ciphersuites for TLSv1.3. */
  Ciphersuites?: string[];
/** Description of the SSL configuration. */
  Description?: string;
/** Size of Diffie Hellman key. Relevant for server configurations only. Default is 0 (Auto) */
  DiffieHellmanBits?: number;
/** Configuration is enabled. Required on creation, optional on updates. */
  Enabled?: boolean;
/** OCSP Stapling.<br>Clients: 0 = None, 1 = Require valid OCSP Stapling (continue only if OCSP verification succeeds).<br>Servers: 0 = None, 1 = Support OCSP Stapling */
  OCSP?: number;
/** For Servers with OCSP Stapling support, this is issuer certificate to be used when requesting an OCSP response. */
  OCSPIssuerCert?: string;
/** For Servers with OCSP Stapling support, this is the path to store the cached OCSP response file. */
  OCSPResponseFile?: string;
/** For Servers with OCSP Stapling support, this is the timeout (in seconds) when attempting to update the OCSP response. */
  OCSPTimeout?: number;
/** OCSPURL.<br>For Servers with OCSP Stapling support, this is the URL used to request an OCSP response<br>Note: this is populated automatically based on the server certificate. */
  OCSPURL?: string;
/** File containing this configuration's private key.<br>Can be an absolute pathname or a pathname relative to the manager's directory. If not null, CertificateFile must also be specified. */
  PrivateKeyFile?: string;
/** Private key type, one of: 1 = DSA, 2 = RSA, 3 = ECDSA */
  PrivateKeyType?: number;
/** Maximum TLS protocol version enabled.<br>2 - SSLv3<br>4 - TLSv1.0<br>8 - TLSv1.1<br>16 - TLSv1.2<br>32 - TLSv1.3<br>Default = TLSv1.3. Requirement is TLSMaxVersion >= TLSMinVersion */
  TLSMaxVersion?: number;
/** Minimum TLS protocol version enabled.<br>2 - SSLv3<br>4 - TLSv1.0<br>8 - TLSv1.1<br>16 - TLSv1.2<br>32 - TLSv1.3<br>Default is TLSv1.2. Requirement is TLSMinVersion <= TLSMaxVersion */
  TLSMinVersion?: number;
/** Intended type for this configuration. 0 = client. 1 = server. Default is client (0). Required on creation, optional on updates. */
  Type?: number;
/** Maximum number of CA certificates allowed in peer certificate chain. */
  VerifyDepth?: number;
/** Peer certificate verification level.<br>Clients:<br>0 = None (continue even if certificate verification fails),<br>1 = Require server certificate (continue only if certificate verification succeeds).< */
  VerifyPeer?: number;
}

export type SSLConfigurationList = {   Name?: string;   Description?: string;   Enabled?: boolean;   Type?: "Server" | "Client"; }[];

export interface Service {
/** Authentication methods enabled for the service. Bit 0 = AutheK5CCache, Bit 1 = AutheK5Prompt, Bit 2 = AutheK5API, Bit 3 = AutheK5KeyTab, Bit 4 = AutheOS, Bit 5 - AuthePassword, Bit 6 = AutheUnauthenti */
  AutheEnabled?: number;
/** List of valid IP addresses allowed to connect for this service. */
  ClientSystems?: string[];
/** Full name of the service */
  Description?: string;
/** Service enabled */
  Enabled?: boolean;
}

export interface ServiceList {

}

export interface SetKillRecord {
/** Cluster journal sequence number of the record on a clustered system or 0 otherwise */
  ClusterSequence?: number;
/** Directory path of the database updated by the SET or KILL */
  DatabaseName?: string;
/** Mirror database name of the database updated by the SET or KILL if it is a mirrored database */
  MirrorDatabaseName?: string;
/** Extended global reference of the SET or KILL */
  GlobalReference?: string;
/** Global node of the SET or KILL (<i>GlobalReference</i> minus the namespace) */
  GlobalNode?: string;
/** Number of data values stored in the record. It can be 0, 1 or 2 depending on whether the record is a SET or KILL and whether it is in a transaction. */
  NumberOfValues?: number;
/** (For SET record only) The value the global node was set to */
  NewValue?: string;
/** (For <i>InTransaction</i> record only) The value of the global node prior to the SET or KILL */
  OldValue?: string;
/** The collation of the subscripts in <i>GlobalNode</i> */
  Collation?: number;
}

export interface SharedMemoryUsage {

}

export interface Superserver {
/** TCP port the server listens on. */
  Port?: number;
/** Address the server binds to. */
  BindAddress?: string;
/** Description of the Server */
  Description?: string;
  EnableCacheDirect?: boolean;
  EnableClients?: boolean;
  EnableCSP?: boolean;
  EnableDataCheck?: boolean;
  EnableECP?: boolean;
  EnableMirror?: boolean;
  EnableNodeJS?: boolean;
  EnableShadows?: boolean;
  EnableSharding?: boolean;
  EnableSNMP?: boolean;
  EnableWebLink?: boolean;
/** Server enabled */
  Enabled?: boolean;
/** SSL configuration used for client connections. */
  SSLConfig?: string;
/** Use SSL/TLS for Client connections.<br>0 = None<br>1 = Accept<br>2 = Require */
  SSLSupportLevel?: number;
  SystemDefault?: boolean;
}

export type SuperserverList = Superserver[];

export interface SymmetricKeySecret {
/** Length (in bytes) of the key */
  Length?: number;
}

export interface SystemResourcesStats {

}

export interface SystemStatus {
/** Elapsed time since this system was started. */
  UpTime?: string;
/** Date and time of the last full system backup, or "Never" */
  LastBackup?: string;
/** Indicates whether the System Monitor is running. If the System Monitor is not running then the values on this page do not get updated. */
  SystemMonitor?: boolean;
}

export interface SystemUsage {
/** Indicates whether there is a reasonable amount of diskspace available for database files. */
  DatabaseSpace?: string;
/** Indicates the current status of the database journal. */
  DatabaseJournal?: string;
/** Indicates whether there is a reasonable amount of diskspace available for journal files. */
  JournalSpace?: string;
/** Number of entries written to the system journal. */
  JournalEntries?: number;
/** Indicates the current status of the system Lock Table. */
  LockTable?: string;
/** Indicates the current status of the system Write Daemon. */
  WriteDaemon?: string;
/** Most recent number of running processes. */
  Processes?: number;
/** Most recent number of web sessions. */
  CSPSessions?: number;
/** Running processes with highest amount of activity (number of commands executed). */
  BusyProcesses?: {   Process?: number;   Commands?: number; }[];
}

export interface SystemUsageStats {
  AllGlobalReferences?: number;
  GlobalUpdateReferences?: number;
  RoutineCalls?: number;
  RoutineBufferLoadsAndSaves?: number;
  LogicalBlockRequests?: number;
  BlockReads?: number;
  BlockWrites?: number;
  WIJwrites?: number;
  JournalEntries?: number;
  JournalBlockWrites?: number;
  RoutineLines?: number;
  LastUpdate?: string;
}

export type Task = {   Name?: string; /** Name of the task. Must be 50 characters or less, first character must be a letter. Note that Names longer than 50 characters will be truncated. */    RunAsUser?: string; /** Username of user to run as.<br>A user must have the %Admin_Secure:Use privilege to define a task to run as another user. */    EmailOnCompletion?: string[]; /** A list of email addresses to send a completion notification to. */    EmailOnError?: string[]; /** A list of email addresses to send an error notification to. */    EmailOnExpiration?: string[]; /** A list of email addresses to send notification if the task expires. */    EmailOutput?: boolean; /** If an output directory and output file are chosen, and EmailOutput is set to true the output from the entry will be emailed to the email addresses in the EmailOnCompletion property. */    Expires?: boolean; /** Whether this entry expires. Expiration is only checked if this flag is set to true. Expiration is determined by whichever is first: 1) The current time passed the next submit time. 2) Expiration Offse */    ExpiresDays?: number;   ExpiresHours?: number;   ExpiresMinutes?: number;   OpenOutputFile?: boolean; /** If the output from the executed code is to be directed to an outputfile, open the output file.  If the executed code handles the open and close this value should be 0. */    OutputDirectory?: string; /** If an output directory and output file are chosen, the output from the entry will be directed there. */    OutputFilename?: string; /** If an output directory and output file are chosen, the output from the entry will be directed there. Note that if OutputDirectory is blank, this may contain the full file name. */    OutputFileIsBinary?: boolean; /** When emailing the output file this flag will indicate if the file should be sent as binary */    SuspendOnError?: boolean; /** Option to suspend a Task if it encounters an error during a run. By default the Task is just rescheduled for its next run.<br><br> Note that this only applies to errors returned by the OnTask method.  */    SuspendTerminated?: boolean; /** Option to suspend a Task if it has been terminated by a system shutdown. By default the Task is just rescheduled for its next run at startup.<br><br>Note that this only applies to Tasks that are found */    Priority?: "Normal" | "Low" | "High"; /** Background Job priority */    TaskClass?: string; /** A class in the specified 'NameSpace' which inherits from %SYS.Task.Definition */    IsBatch?: boolean; /** Batch mode restricts the job to a small section of the buffer pool.<br>false - Don't run in batch mode (default)<br>True - Run in batch mode */    NameSpace?: string; /** Namespace to run the task in (default="%SYS") */    TimePeriod?: "Daily" | "Weekly" | "Monthly" | "Monthly Special" | "Run After" | "On Demand"; /** Time period to run the task.<br>This property governs how the properties TimePeriodEvery and TimePeriodDay are interpreted<br><br>Valid parameters For TimePeriod are<br><br>0 - DAILY<br>TimePeriodEver */    TimePeriodEvery?: string; /** See TimePeriod property for legal values */    TimePeriodDay?: string; /** See TimePeriod property for legal values */    DailyFrequency?: "Once" | "Several"; /** How often each day to run the task.<br>This property governs how the properties DailyFrequencyTime, DailyIncrement, DailyStartTime, and DailyEndTime are interpreted.<br><br>Valid parameters for DailyF */    DailyFrequencyTime?: "Hourly" | "Minutes"; /** See DailyFrequency property for legal values */    DailyIncrement?: string; /** See DailyFrequency property for legal values */    DailyStartTime?: string; /** See DailyFrequency property for legal values */    DailyEndTime?: string; /** See DailyFrequency property for legal values */    RunAfterGUID?: string; /** Execute this job when specified job completes */    StartDate?: string; /** When to schedule the task first<br>Default is to start tomorrow */    EndDate?: string; /** When to stop scheduling the task<br>Default is to never stop scheduling */    MirrorStatus?: "Primary" | "Non-Primary" | "Any"; /** Used to control the execution of tasks when the system is part of a Mirror. Tasks may be scheduled to run on each Mirror Member, but will only be executed if the current status matches what is indicat */    RescheduleOnStart?: boolean; /** If true, when the CheckSchedule class method is called with SystemStart=1 any jobs pending in the task queue will be removed, and rescheduled for their next time. For example, the journal switch is sc */    Description?: string; /** Description of task */    Settings?: Record<string, any>; /** The settings associated with the TaskClass. This is an arbitrary object and the relevant keys depend on the TaskClass. */  };

export type TaskExtraInfo = {   LastSchedule?: string; /** When the task was last scheduled to run. "" - Never run */    LastStarted?: string; /** When the task was last started. "" - Never started */    LastFinished?: string; /** When the task was last finished. "" - did not finish */    Status?: string; /** Return value of the method %OnTask.<br><br>If not defined by the task default success will be 1 <br>If the job is currently running (JobRunning) Status will be -1 <br>If there was an untrapped error ( */    Error?: string; /** Untrapped error from User task, or "Success" */    Type?: "System" | "Maintenance" | "User"; /** Type 'System' and 'Maintenance' are reserved for System Tasks. This gets assigned by the system when a task is specified. */    NextScheduled?: string; /** When the task is next scheduled to run. */    Suspended?: boolean; };

export interface TaskHistory {

}

export type TaskList = {   Name?: string;   Type?: "System" | "Cache" | "User";   Namespace?: string;   Description?: string;   Id?: number;   Suspended?: boolean;   LastFinished?: string; /** Example is "2026-02-23 00:00" or "2026-02-23 00:00:00" */    NextScheduled?: string; /** Example is "2026-02-23 00:00" or "2026-02-23 00:00:00" */  }[];

export interface TelnetSettings {
  DNSLookup?: string;
  Port?: number;
}

export interface UpcomingTask {
  Task?: string;
  Time?: string;
  Status?: string;
}

export interface UpcomingTasks {

}

export interface User {
/** Account Expiration behavior. False - Account expires normally. True - Account will never expire. */
  AccountNeverExpires?: boolean;
/** Two factor Authentication options which are enabled for this user. Options are:<br>2**20 - SMS Text authentication.<br>2**21 - Time-based One-time Password */
  AutheEnabled?: number;
/** Change password on next login. False - Password change not required. True - Password change required before next login. */
  ChangePassword?: boolean;
/** Comment. */
  Comment?: string;
/** Email address of the user. */
  EmailAddress?: string;
/** Allow user to log in. False - Disable login. True - Enable login. */
  Enabled?: boolean;
/** Last date an account can be used. If there is no limit, this value may be 1840-12-31 or "" */
  ExpirationDate?: string;
/** Full name of the user. */
  FullName?: string;
/** Display the Time-based One-time Password QR code or key on next login for the user to scan with their authentication device. */
  HOTPKeyDisplay?: boolean;
/** NameSpace to run in only if a terminal session. */
  NameSpace?: string;
/** Password expires behavior. False - Password expires normally. True - Password never expires. */
  PasswordNeverExpires?: boolean;
/** Phone number for two-factor authentication */
  PhoneNumber?: string;
/** Mobile phone service provider for two-factor authentication */
  PhoneProvider?: string;
/** Roles assigned to the user. */
  Roles?: string[];
  EscalationRoles?: string[];
/** Routine to run only if terminal session, ""=Programmer mode. */
  Routine?: string;
}

export interface UserList {

}

export type VectorSetKillRecord = {   VecIndex?: number; /** The index into the vector set $vector(gref, index, type)=value or kill $vector(gref, index) */    VecType?: "integer" | "decimal" | "double" | "timestamp" | "string" | "xf32"; /** The string value representing the type of the vector which is the target of the vector operation */  };

export interface VolumeFiles {

}

export interface WQMCategory {
/** When a work group in this category is created and no worker job count is specified this is the default number of worker jobs we will assign to the group. 0 = Dynamic. Required on creation, optional on */
  DefaultWorkers?: number;
/** Maximum number of active worker jobs we will keep in the pool of jobs servicing requests in this category. Idle jobs are detected and new jobs are started automatically to keep the maximum active job  */
  MaxActiveWorkers?: number;
/** When a work group in this category is created specifying the number of worker jobs wanted and the number requested is greater than this limit then we will use this limit value instead. 0 = Dynamic */
  MaxWorkers?: number;
/** If non-zero, specifies the maximum number of workers we will start in this category. Even if all existing workers are blocked, we will not start more workers once we reach this limit. This is useful f */
  MaxTotalWorkers?: number;
/** If true makes this a true queue where you need to wait for the work group request to get to the head of the queue in order to get a worker assigned. When AlwaysQueue=0 for a category when a new WQM gr */
  AlwaysQueue?: boolean;
}

export interface WQMCategoryList {

}

export interface WalletCollection {
/** Access to this resource is required to add secrets to, or to remove secrets from this collection, and to edit secrets in the collection. Specified as "resource:permission". If permission is omitted "W */
  EditResource?: string;
/** Access to this resource is required to use secrets in this collection. Specified as "resource:permission". If permission is omitted "READ" is used. Required on creation, optional on updates. */
  UseResource?: string;
}

export type WalletCollectionList = WalletCollection[];

export type WalletSecret = {   Type?: "%Wallet.KeyValue" | "%Wallet.SymmetricKey" | "%Wallet.RSA"; /** Class name used to implement the secret, e.g. %Wallet.KeyValue. Required. */    WalletSecretConfig?: Record<string, any>; /** An object containing properties and values that are appropriate for the given secret type. This object will be passed directly to the Create or Modify method of the class specified in the "Type" field */  };

export interface WalletSecretListItem {
  Name?: string;
  Type?: string;
}

export type WalletSecretList = WalletSecretListItem[];

export interface WebAppPctAccess {
/** Allow access. False - Don't allow access to the class/Package. True - Allow access to the class/Package. Required. */
  AllowAccess?: boolean;
}

export interface WebApplicationList {

}

export type WebAuthenticationSettings = {   AutheUnauthenticated?: boolean;   AutheOS?: boolean;   AutheOSDelegated?: boolean;   AutheOSLDAP?: boolean;   AutheCache?: boolean;   AutheDelegated?: boolean;   AutheAlwaysTryDelegated?: boolean;   AutheKB?: boolean;   AutheLDAP?: boolean;   AutheLDAPCache?: boolean;   AutheOAuth2?: boolean;   AutheLoginToken?: boolean;   AutheTwoFactorSMS?: boolean;   AutheTwoFactorPW?: boolean;   LoginCookieTimeout?: number;   SMTPServer?: string;   SMTPUsername?: string;   TwoFactorFrom?: string;   TwoFactorTimeout?: number;   JWTIssuer?: string;   JWTSigAlg?: "RS256" | "RS384" | "RS512" | "ES256" | "ES384" | "ES512"; };

export interface WebSessionList {

}

export interface X509Credential {
/** Name (alias) of the credential. Required on creation. */
  Alias?: string;
/** Whether a private key is present. */
  HasPrivateKey?: boolean;
/** File containing the X.509 certificate(s). Required on creation (POST). */
  CertificateFile?: string;
/** File containing the private key. */
  PrivateKeyFile?: string;
/** Password for the private key. */
  PrivateKeyPassword?: string;
/** Array of usernames which may access these credentials. If the OwnerList is empty, the credentials are available to any user. */
  OwnerList?: string[];
/** File containing X.509 certificate(s) of trusted Certificate Authorities. */
  CAFile?: string;
/** PeerNames is an optional array of peers which expect this certificate to be used. */
  PeerNames?: string[];
}

export interface X509CredentialCertificate {
/** Returns if a private key is present even if no privileges. */
  HasPrivateKey?: boolean;
/** SerialNumber of the certificate -- unique for the Issuer. */
  SerialNumber?: string;
/** Issuer DistinguishedName of the certificate. */
  IssuerDN?: string;
/** Subject DistinguishedName of the certificate. */
  SubjectDN?: string;
/** X.509 ValidityNotBefore from the certificate. */
  ValidityNotBefore?: string;
/** X.509 ValidityNotAfter from the certificate. */
  ValidityNotAfter?: string;
}

export type X509CredentialsList = X509Credential[];
