import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { coalesce } from '../core/coalesce';
import { I18nService } from '../core/i18n.service';
import type { ConfigDatabase, DocDBApplication, LocalDatabase } from '@iris-portico/api-client';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Databases — three areas:
 *
 * 1. **Local database directories** (`/v2/database-dir*`): list, inspect
 *    config, volumes and runtime info (async), run maintenance (compact /
 *    defragment / integrity check / mount / dismount), the size-management
 *    actions (truncate / expand / volume expansion), create/delete, and edit
 *    the directory config (PUT /v2/database-dir, body `dir` required).
 * 2. **Config databases** (`/v2/databases`): list, detail
 *    (GET /v2/database?name), create/edit (PUT /v2/database, body `name`
 *    required) and delete (DELETE /v2/database?name — DANGEROUS,
 *    double-confirm). Gated on %Admin_Manage.
 * 3. **Doc-DB applications** (`/v2/doc-dbs`): list, detail
 *    (GET /v2/doc-db?name), create/edit (PUT /v2/doc-db, body `name`
 *    required) and delete (DELETE /v2/doc-db?name — confirm). Gated on
 *    %Admin_Secure.
 *
 * All mutating operations answer `202 + Location` (the long-running-operations
 * pattern); the page resolves the task id so the work can be followed from
 * the Async Task Center.
 */
@Component({
  selector: 'app-databases',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('databases.title') }}</h2>
          <p class="muted">{{ t('databases.subtitle') }}</p>
        </div>
        <div class="toolbar">
          @if (canManage) {
            <button (click)="openCreateDialog()">{{ t('databases.new') }}</button>
          }
          <button (click)="refreshCurrent()" [disabled]="loading">{{ loading ? t('databases.loading') : t('common.refresh') }}</button>
        </div>
      </div>

      <div class="toolbar" style="margin-bottom:12px">
        <button class="ghost" [style.font-weight]="tab === 'local' ? '700' : ''" (click)="switchTab('local')">{{ t('databases.tab.local') }}</button>
        <button class="ghost" [style.font-weight]="tab === 'config' ? '700' : ''" (click)="switchTab('config')">{{ t('databases.tab.config') }}</button>
        <button class="ghost" [style.font-weight]="tab === 'docdb' ? '700' : ''" (click)="switchTab('docdb')">{{ t('databases.tab.docdb') }}</button>
      </div>

      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }
      @if (notice) { <div class="card"><p class="notice">{{ notice }}</p></div> }

      @if (tab === 'local') {
        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('databases.list') }}</h2>
              <span class="spacer"></span>
              <span class="muted">{{ dbs.length }}</span>
            </div>
            @if (dbs.length) {
              <table>
                <thead>
                  <tr>
                    <th>{{ t('databases.col.resource') }}</th>
                    <th>{{ t('databases.col.directory') }}</th>
                    <th>{{ t('databases.col.size') }}</th>
                    <th>{{ t('databases.col.max') }}</th>
                    <th>{{ t('databases.col.status') }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of dbs; track coalesce(d.Directory, d.directory)) {
                    <tr (click)="selectDb(d)" [style.background]="selectedDir === (coalesce(d.Directory, d.directory)) ? 'var(--bg-elev-2)' : ''">
                      <td class="mono">{{ coalesce(d.Resource, d.resource) }}</td>
                      <td class="mono small" [title]="coalesce(d.Directory, d.directory)">{{ coalesce(d.Directory, d.directory) }}</td>
                      <td>{{ coalesce(d.Size, d.size) }}</td>
                      <td>{{ coalesce(d.MaxSize, d.maxsize) }}</td>
                      <td>
                        <span class="badge" [class.ok]="isRW(d)" [class.warn]="isRO(d)" [class.danger]="isDown(d)">{{ coalesce(d.Status, d.status) }}</span>
                        @if (coalesce(d.Encrypted, d.encrypted)) { <span class="badge">{{ t('databases.badge.encrypted') }}</span> }
                        @if (coalesce(d.Mirrored, d.mirrored)) { <span class="badge">{{ t('databases.badge.mirrored') }}</span> }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="empty">{{ t('databases.empty') }}</p>
            }
          </div>

          <div class="card">
            <h2>{{ t('databases.detail') }}</h2>
            @if (!selectedDir) {
              <p class="empty">{{ t('databases.select') }}</p>
            } @else {
              <p class="muted mono">{{ selectedDir }}</p>
              <div class="toolbar" style="margin:10px 0">
                <button (click)="loadDetail()">{{ t('databases.loadDetail') }}</button>
                <button (click)="loadVolumes()">{{ t('databases.loadVolumes') }}</button>
                <button (click)="runInfo()" [disabled]="infoBusy">{{ t('databases.getInfo') }}</button>
              </div>

              @if (config) {
                <h3>{{ t('databases.config') }}</h3>
                <table>
                  <tbody>
                    <tr><td>{{ t('databases.cfg.resource') }}</td><td class="mono">{{ coalesce(config.ResourceName, config.resourcename) }}</td></tr>
                    <tr><td>{{ t('databases.cfg.maxSize') }}</td><td>{{ cfgMaxSizeLabel(config) }}</td></tr>
                    <tr><td>{{ t('databases.cfg.expansion') }}</td><td>{{ coalesce(config.ExpansionSize, config.expansionsize) }} MB</td></tr>
                    <tr><td>{{ t('databases.cfg.volThreshold') }}</td><td>{{ coalesce(config.NewVolumeThreshold, config.newvolumethreshold) }} MB</td></tr>
                    <tr><td>{{ t('databases.cfg.newVolDir') }}</td><td class="mono">{{ coalesce(config.NewVolumeDirectory, config.newvolumedirectory) }}</td></tr>
                    <tr><td>{{ t('databases.cfg.keep') }}</td><td>{{ truthyLabel(config.NewGlobalIsKeep, config.newglobaliskeep) }}</td></tr>
                    <tr><td>{{ t('databases.cfg.collation') }}</td><td>{{ coalesce(config.NewGlobalCollation, config.newglobalcollation) }}</td></tr>
                    <tr><td>{{ t('databases.cfg.cluster') }}</td><td>{{ truthyLabel(config.ClusterMountMode, config.clustermountmode) }}</td></tr>
                    <tr><td>{{ t('databases.cfg.readonly') }}</td><td>{{ truthyLabel(config.ReadOnly, config.readonly) }}</td></tr>
                    <tr><td>{{ t('databases.cfg.journal') }}</td><td>{{ truthyLabel(config.GlobalJournalState, config.globaljournalstate) }}</td></tr>
                  </tbody>
                </table>
              }

              @if (canManage && config) {
                @if (editDirOpen) {
                  <h3>{{ t('databases.editDir') }}</h3>
                  <table>
                    <tbody>
                      <tr><td>{{ t('databases.editDir.f.dir') }}</td><td class="mono">{{ selectedDir }}</td></tr>
                      <tr><td>{{ t('databases.editDir.f.maxSize') }}</td><td><input type="number" [(ngModel)]="dirEditMaxSize" style="width:130px" /></td></tr>
                      <tr><td>{{ t('databases.editDir.f.expansion') }}</td><td><input type="number" [(ngModel)]="dirEditExpansionSize" style="width:130px" /></td></tr>
                      <tr><td>{{ t('databases.editDir.f.volThreshold') }}</td><td><input type="number" [(ngModel)]="dirEditVolThreshold" style="width:130px" /></td></tr>
                      <tr><td>{{ t('databases.editDir.f.newVolDir') }}</td><td><input placeholder="{{ t('databases.editDir.f.newVolDir') }}" [(ngModel)]="dirEditNewVolDir" style="width:220px" /></td></tr>
                      <tr><td>{{ t('databases.editDir.f.keep') }}</td><td><input type="checkbox" [(ngModel)]="dirEditKeep" /></td></tr>
                      <tr><td>{{ t('databases.editDir.f.collation') }}</td><td><input type="number" [(ngModel)]="dirEditCollation" style="width:130px" /></td></tr>
                      <tr><td>{{ t('databases.editDir.f.cluster') }}</td><td><input type="checkbox" [(ngModel)]="dirEditCluster" /></td></tr>
                      <tr><td>{{ t('databases.editDir.f.readonly') }}</td><td><input type="checkbox" [(ngModel)]="dirEditReadOnly" /></td></tr>
                      <tr><td>{{ t('databases.editDir.f.journal') }}</td><td><input type="checkbox" [(ngModel)]="dirEditJournal" /></td></tr>
                    </tbody>
                  </table>
                  <div class="toolbar">
                    <button (click)="saveDirConfig()" [disabled]="busy">{{ t('databases.editDir.save') }}</button>
                    <button class="ghost" (click)="editDirOpen = false">{{ t('databases.editDir.close') }}</button>
                  </div>
                  <p class="muted small">{{ t('databases.editDir.note') }}</p>
                } @else {
                  <div class="toolbar">
                    <button class="ghost" (click)="openEditDir()">{{ t('databases.editDir.open') }}</button>
                  </div>
                }
              }

              @if (infoBusy) { <p class="muted">{{ t('databases.infoRunning') }}</p> }
              @if (info) {
                <h3>{{ t('databases.runtime') }}</h3>
                <table>
                  <tbody>
                    <tr><td>{{ t('databases.rt.size') }}</td><td>{{ coalesce(info.Size, info.size) }} MB</td></tr>
                    <tr><td>{{ t('databases.rt.blockSize') }}</td><td>{{ coalesce(info.BlockSize, info.blocksize) }} B / {{ coalesce(info.Blocks, info.blocks) }} blocks</td></tr>
                    <tr><td>{{ t('databases.rt.available') }}</td><td>{{ coalesce(info.AvailableSpace, info.availablespace) }} MB</td></tr>
                    <tr><td>{{ t('databases.rt.diskFree') }}</td><td>{{ coalesce(info.DiskFree, info.diskfree) }}</td></tr>
                    <tr><td>{{ t('databases.rt.endFree') }}</td><td>{{ coalesce(info.EndFree, info.endfree) }} MB</td></tr>
                    <tr><td>{{ t('databases.rt.lastExpansion') }}</td><td>{{ coalesce(info.LastExpansionTime, info.lastexpansiontime) }}</td></tr>
                    <tr><td>{{ t('databases.rt.mounted') }}</td><td><span class="badge" [class.ok]="truthy(info.Mounted, info.mounted)" [class.danger]="!truthy(info.Mounted, info.mounted)">{{ truthy(info.Mounted, info.mounted) ? t('common.on') : t('common.off') }}</span></td></tr>
                    <tr><td>{{ t('databases.rt.full') }}</td><td><span class="badge" [class.danger]="truthy(info.Full, info.full)" [class.ok]="!truthy(info.Full, info.full)">{{ truthy(info.Full, info.full) ? t('common.on') : t('common.off') }}</span></td></tr>
                  </tbody>
                </table>
              }

              @if (volumes.length) {
                <h3>{{ t('databases.volumes') }}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{{ t('databases.vol.file') }}</th>
                      <th>{{ t('databases.col.size') }}</th>
                      <th>{{ t('databases.vol.diskfree') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (v of volumes; track coalesce(v.VolumeNumber, v.volumenumber)) {
                      <tr>
                        <td>{{ coalesce(v.VolumeNumber, v.volumenumber) }}</td>
                        <td class="mono">{{ coalesce(v.File, v.file) }}</td>
                        <td>{{ coalesce(v.Size, v.size) }} MB</td>
                        <td>{{ coalesce(v.DiskFree, v.diskfree) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }

              @if (canOperate) {
                <h3>{{ t('databases.actions') }}</h3>
                <div class="toolbar">
                  <button (click)="runAction('compact')" [disabled]="busy">{{ t('databases.act.compact') }}</button>
                  <button (click)="runAction('defragment')" [disabled]="busy">{{ t('databases.act.defragment') }}</button>
                  <button (click)="runAction('integrity')" [disabled]="busy">{{ t('databases.act.integrity') }}</button>
                  @if (info && truthy(info.Mounted, info.mounted)) {
                    <button class="ghost" (click)="runAction('dismount')" [disabled]="busy">{{ t('databases.act.dismount') }}</button>
                  } @else {
                    <button class="ghost" (click)="runAction('mount')" [disabled]="busy">{{ t('databases.act.mount') }}</button>
                  }
                </div>
                <p class="muted small">{{ t('databases.asyncNote') }}</p>
              }

              @if (canManage) {
                <h3 class="danger">{{ t('databases.danger') }}</h3>
                <div class="toolbar">
                  <input type="number" placeholder="{{ t('databases.ph.targetSize') }}" [(ngModel)]="truncateSize" style="width:130px" />
                  <button class="ghost danger" (click)="doTruncate()" [disabled]="busy">{{ t('databases.act.truncate') }}</button>
                </div>
                <div class="toolbar">
                  <input type="number" placeholder="{{ t('databases.ph.newSize') }}" [(ngModel)]="newSize" style="width:130px" />
                  <button class="ghost danger" (click)="doModifySize()" [disabled]="busy">{{ t('databases.act.modifySize') }}</button>
                  <input type="number" placeholder="{{ t('databases.ph.volSize') }}" [(ngModel)]="volSize" style="width:130px" />
                  <button class="ghost danger" (click)="doExpandVolume()" [disabled]="busy">{{ t('databases.act.expandVolume') }}</button>
                  <button class="ghost danger" (click)="doDelete()" [disabled]="busy">{{ t('databases.act.delete') }}</button>
                </div>
                <p class="muted small">{{ t('databases.dangerNote') }}</p>
              }
            }
          </div>
        </div>

        @if (createDialog) {
          <div class="card">
            <h2>{{ t('databases.create') }}</h2>
            <div class="toolbar">
              <input placeholder="{{ t('databases.ph.directory') }}" [(ngModel)]="newDir" style="width:280px" />
              <input type="number" placeholder="{{ t('databases.ph.maxSize') }}" [(ngModel)]="newMaxSize" style="width:130px" />
              <button (click)="doCreate()" [disabled]="busy">{{ t('common.create') }}</button>
              <button class="ghost" (click)="createDialog = false">{{ t('common.cancel') }}</button>
            </div>
            <p class="muted small">{{ t('databases.createNote') }}</p>
          </div>
        }
      } @else if (tab === 'config') {
        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('databases.cfgdb.title') }}</h2>
              <span class="spacer"></span>
              <span class="muted">{{ cfgDbs.length }}</span>
            </div>
            @if (canManage) {
              <div class="toolbar" style="margin-bottom:8px">
                <button (click)="openCfgDbCreate()" [disabled]="cfgBusy">{{ t('databases.cfgdb.new') }}</button>
              </div>
            }
            @if (cfgDbs.length) {
              <table>
                <thead>
                  <tr>
                    <th>{{ t('databases.cfgdb.col.name') }}</th>
                    <th>{{ t('databases.cfgdb.col.server') }}</th>
                    <th>{{ t('databases.cfgdb.col.directory') }}</th>
                    <th>{{ t('databases.cfgdb.col.mount') }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of cfgDbs; track coalesce(d.Name, d.name)) {
                    <tr (click)="selectCfgDb(d)" [style.background]="cfgSelected === (coalesce(d.Name, d.name)) ? 'var(--bg-elev-2)' : ''">
                      <td class="mono">{{ coalesce(d.Name, d.name) }}</td>
                      <td class="mono small">{{ coalesce(d.Server, d.server) }}</td>
                      <td class="mono small" [title]="coalesce(d.Directory, d.directory)">{{ coalesce(d.Directory, d.directory) }}</td>
                      <td><span class="badge" [class.ok]="truthy(d.MountAtStartup, d.mountatstartup)">{{ truthy(d.MountAtStartup, d.mountatstartup) ? t('common.on') : t('common.off') }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="empty">{{ t('databases.cfgdb.empty') }}</p>
            }
          </div>

          <div class="card">
            <h2>{{ t('databases.cfgdb.detail') }}</h2>
            @if (cfgFormOpen) {
              <h3>{{ t('databases.cfgdb.create') }}</h3>
              <table>
                <tbody>
                  <tr><td>{{ t('databases.cfgdb.f.name') }}</td><td><input placeholder="{{ t('databases.cfgdb.ph.name') }}" [(ngModel)]="cfgFormName" style="width:220px" /></td></tr>
                  <tr><td>{{ t('databases.cfgdb.f.server') }}</td><td><input placeholder="{{ t('databases.cfgdb.ph.server') }}" [(ngModel)]="cfgFormServer" style="width:220px" /></td></tr>
                  <tr><td>{{ t('databases.cfgdb.f.directory') }}</td><td><input placeholder="{{ t('databases.cfgdb.ph.directory') }}" [(ngModel)]="cfgFormDirectory" style="width:220px" /></td></tr>
                  <tr><td>{{ t('databases.cfgdb.f.stream') }}</td><td><input placeholder="{{ t('databases.cfgdb.ph.stream') }}" [(ngModel)]="cfgFormStreamLocation" style="width:220px" /></td></tr>
                  <tr><td>{{ t('databases.cfgdb.f.mountStartup') }}</td><td><input type="checkbox" [(ngModel)]="cfgFormMountAtStartup" /></td></tr>
                  <tr><td>{{ t('databases.cfgdb.f.mountRequired') }}</td><td><input type="checkbox" [(ngModel)]="cfgFormMountRequired" /></td></tr>
                  <tr><td>{{ t('databases.cfgdb.f.cluster') }}</td><td><input type="checkbox" [(ngModel)]="cfgFormClusterMountMode" /></td></tr>
                </tbody>
              </table>
              <div class="toolbar">
                <button (click)="saveCfgDb()" [disabled]="cfgBusy">{{ t('databases.cfgdb.save') }}</button>
                <button class="ghost" (click)="cfgFormOpen = false">{{ t('common.cancel') }}</button>
              </div>
            } @else if (!cfgSelected) {
              <p class="empty">{{ t('databases.cfgdb.select') }}</p>
            } @else {
              <p class="muted mono">{{ cfgSelected }}</p>
              <div class="toolbar" style="margin:10px 0">
                <button (click)="loadCfgDbDetail()">{{ t('databases.cfgdb.loadDetail') }}</button>
                @if (canManage) {
                  <button (click)="editCfgDb()" [disabled]="cfgBusy">{{ t('databases.cfgdb.edit') }}</button>
                }
              </div>
              @if (cfgDetail) {
                <table>
                  <tbody>
                    <tr><td>{{ t('databases.cfgdb.f.server') }}</td><td class="mono">{{ coalesce(cfgDetail.Server, cfgDetail.server) }}</td></tr>
                    <tr><td>{{ t('databases.cfgdb.f.directory') }}</td><td class="mono">{{ coalesce(cfgDetail.Directory, cfgDetail.directory) }}</td></tr>
                    <tr><td>{{ t('databases.cfgdb.f.stream') }}</td><td class="mono">{{ coalesce(cfgDetail.StreamLocation, cfgDetail.streamlocation) }}</td></tr>
                    <tr><td>{{ t('databases.cfgdb.f.mountStartup') }}</td><td><span class="badge" [class.ok]="truthy(cfgDetail.MountAtStartup, cfgDetail.mountatstartup)">{{ truthy(cfgDetail.MountAtStartup, cfgDetail.mountatstartup) ? t('common.on') : t('common.off') }}</span></td></tr>
                    <tr><td>{{ t('databases.cfgdb.f.mountRequired') }}</td><td><span class="badge" [class.ok]="truthy(cfgDetail.MountRequired, cfgDetail.mountrequired)">{{ truthy(cfgDetail.MountRequired, cfgDetail.mountrequired) ? t('common.on') : t('common.off') }}</span></td></tr>
                    <tr><td>{{ t('databases.cfgdb.f.cluster') }}</td><td><span class="badge" [class.ok]="truthy(cfgDetail.ClusterMountMode, cfgDetail.clustermountmode)">{{ truthy(cfgDetail.ClusterMountMode, cfgDetail.clustermountmode) ? t('common.on') : t('common.off') }}</span></td></tr>
                  </tbody>
                </table>
              }
              @if (canManage) {
                <h3 class="danger">{{ t('databases.cfgdb.danger') }}</h3>
                @if (cfgDeleteArmed) {
                  <div class="toolbar">
                    <button class="ghost danger" (click)="deleteCfgDb()" [disabled]="cfgBusy">{{ t('databases.cfgdb.deleteArmed') }}</button>
                    <button class="ghost" (click)="cfgDeleteArmed = false">{{ t('common.cancel') }}</button>
                  </div>
                } @else {
                  <div class="toolbar">
                    <button class="ghost danger" (click)="armDeleteCfgDb()" [disabled]="cfgBusy">{{ t('databases.cfgdb.delete') }}</button>
                  </div>
                }
                <p class="muted small">{{ t('databases.cfgdb.dangerNote') }}</p>
              }
            }
          </div>
        </div>
      } @else {
        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('databases.docdb.title') }}</h2>
              <span class="spacer"></span>
              <span class="muted">{{ docDbs.length }}</span>
            </div>
            @if (canSecure) {
              <div class="toolbar" style="margin-bottom:8px">
                <button (click)="openDocDbCreate()" [disabled]="docBusy">{{ t('databases.docdb.new') }}</button>
              </div>
            }
            @if (docDbs.length) {
              <table>
                <thead>
                  <tr>
                    <th>{{ t('databases.docdb.col.name') }}</th>
                    <th>{{ t('databases.docdb.col.resource') }}</th>
                    <th>{{ t('databases.docdb.col.enabled') }}</th>
                    <th>{{ t('databases.docdb.col.description') }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of docDbs; track coalesce(d.Name, d.name)) {
                    <tr (click)="selectDocDb(d)" [style.background]="docSelected === (coalesce(d.Name, d.name)) ? 'var(--bg-elev-2)' : ''">
                      <td class="mono">{{ coalesce(d.Name, d.name) }}</td>
                      <td class="mono small">{{ coalesce(d.Resource, d.resource) }}</td>
                      <td><span class="badge" [class.ok]="truthy(d.Enabled, d.enabled)">{{ truthy(d.Enabled, d.enabled) ? t('common.on') : t('common.off') }}</span></td>
                      <td class="small" [title]="coalesce(d.Description, d.description)">{{ coalesce(d.Description, d.description) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="empty">{{ t('databases.docdb.empty') }}</p>
            }
          </div>

          <div class="card">
            <h2>{{ t('databases.docdb.detail') }}</h2>
            @if (docFormOpen) {
              <h3>{{ t('databases.docdb.create') }}</h3>
              <table>
                <tbody>
                  <tr><td>{{ t('databases.docdb.f.name') }}</td><td><input placeholder="{{ t('databases.docdb.ph.name') }}" [(ngModel)]="docFormName" style="width:220px" /></td></tr>
                  <tr><td>{{ t('databases.docdb.f.resource') }}</td><td><input placeholder="{{ t('databases.docdb.ph.resource') }}" [(ngModel)]="docFormResource" style="width:220px" /></td></tr>
                  <tr><td>{{ t('databases.docdb.f.description') }}</td><td><input placeholder="{{ t('databases.docdb.ph.description') }}" [(ngModel)]="docFormDescription" style="width:220px" /></td></tr>
                  <tr><td>{{ t('databases.docdb.f.enabled') }}</td><td><input type="checkbox" [(ngModel)]="docFormEnabled" /></td></tr>
                </tbody>
              </table>
              <div class="toolbar">
                <button (click)="saveDocDb()" [disabled]="docBusy">{{ t('databases.docdb.save') }}</button>
                <button class="ghost" (click)="docFormOpen = false">{{ t('common.cancel') }}</button>
              </div>
            } @else if (!docSelected) {
              <p class="empty">{{ t('databases.docdb.select') }}</p>
            } @else {
              <p class="muted mono">{{ docSelected }}</p>
              <div class="toolbar" style="margin:10px 0">
                <button (click)="loadDocDbDetail()">{{ t('databases.docdb.loadDetail') }}</button>
                @if (canSecure) {
                  <button (click)="editDocDb()" [disabled]="docBusy">{{ t('databases.docdb.edit') }}</button>
                }
              </div>
              @if (docDetail) {
                <table>
                  <tbody>
                    <tr><td>{{ t('databases.docdb.f.resource') }}</td><td class="mono">{{ coalesce(docDetail.Resource, docDetail.resource) }}</td></tr>
                    <tr><td>{{ t('databases.docdb.f.description') }}</td><td>{{ coalesce(docDetail.Description, docDetail.description) }}</td></tr>
                    <tr><td>{{ t('databases.docdb.f.enabled') }}</td><td><span class="badge" [class.ok]="truthy(docDetail.Enabled, docDetail.enabled)">{{ truthy(docDetail.Enabled, docDetail.enabled) ? t('common.on') : t('common.off') }}</span></td></tr>
                  </tbody>
                </table>
              }
              @if (canSecure) {
                <h3 class="danger">{{ t('databases.docdb.danger') }}</h3>
                <div class="toolbar">
                  <button class="ghost danger" (click)="deleteDocDb()" [disabled]="docBusy">{{ t('databases.docdb.delete') }}</button>
                </div>
                <p class="muted small">{{ t('databases.docdb.dangerNote') }}</p>
                <p class="muted small">{{ t('databases.docdb.note') }}</p>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DatabasesComponent implements OnInit {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);

  // Live permission getters (re-evaluated each CD cycle):
  get canOperate(): boolean {
    return this.perms.can(PRIV.OPERATE);
  }
  get canManage(): boolean {
    return this.perms.can(PRIV.MANAGE);
  }
  get canSecure(): boolean {
    return this.perms.can(PRIV.SECURE);
  }

  tab: 'local' | 'config' | 'docdb' = 'local';

  // Local databases (existing functionality).
  dbs: any[] = [];
  selectedDir = '';
  config: any = null;
  info: any = null;
  infoBusy = false;
  volumes: any[] = [];
  loading = false;
  busy = false;
  error = '';
  notice = '';

  createDialog = false;
  newDir = '';
  newMaxSize: number | null = null;
  truncateSize: number | null = null;
  newSize: number | null = null;
  volSize: number | null = null;

  // Edit the local directory config (PUT /v2/database-dir, body `dir` required).
  editDirOpen = false;
  dirEditMaxSize: number | null = null;
  dirEditExpansionSize: number | null = null;
  dirEditVolThreshold: number | null = null;
  dirEditNewVolDir = '';
  dirEditKeep = false;
  dirEditCollation: number | null = null;
  dirEditCluster = false;
  dirEditReadOnly = false;
  dirEditJournal = false;

  // Config databases (GET /v2/databases, GET/PUT/DELETE /v2/database).
  cfgDbs: any[] = [];
  cfgSelected = '';
  cfgDetail: any = null;
  cfgBusy = false;
  cfgFormOpen = false;
  cfgFormName = '';
  cfgFormServer = '';
  cfgFormDirectory = '';
  cfgFormStreamLocation = '';
  cfgFormMountAtStartup = false;
  cfgFormMountRequired = false;
  cfgFormClusterMountMode = false;
  cfgDeleteArmed = false;

  // Doc-DB applications (GET /v2/doc-dbs, GET/PUT/DELETE /v2/doc-db).
  docDbs: any[] = [];
  docSelected = '';
  docDetail: any = null;
  docBusy = false;
  docFormOpen = false;
  docFormName = '';
  docFormResource = '';
  docFormDescription = '';
  docFormEnabled = false;

  ngOnInit(): void {
    this.load();
    this.loadConfigDbs();
    this.loadDocDbs();
  }

  /** True when the given value (either casing) is truthy. */
  truthy(a: unknown, b: unknown): boolean {
    const v = a !== undefined && a !== null ? a : b;
    return v === true || v === 'true' || v === 'True' || v === 1 || v === '1';
  }

  /** Yes/no label for a boolean-ish value. */
  truthyLabel(a: unknown, b: unknown): string {
    return this.truthy(a, b) ? this.t('common.on') : this.t('common.off');
  }

  /** Coerce an API value (possibly a string) to a number, or null when absent. */
  num(v: unknown): number | null {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  /** Normalize a form number (the input yields a string) to a number, or null. */
  formNum(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  /** 0 means "unlimited" for max sizes. */
  cfgMaxSizeLabel(c: any): string {
    const v = c.MaxSize !== undefined && c.MaxSize !== null ? c.MaxSize : c.maxsize;
    return v === 0 ? this.t('databases.unlimited') : v + ' MB';
  }

  isRW(d: any): boolean {
    const s = String(coalesce(d.Status, d.status, ''));
    return s.includes('RW');
  }

  isRO(d: any): boolean {
    const s = String(coalesce(d.Status, d.status, ''));
    return s.includes('Mounted') && !s.includes('RW');
  }

  isDown(d: any): boolean {
    const s = String(coalesce(d.Status, d.status, ''));
    return s.includes('Dismounted') || s.toLowerCase().includes('unmounted');
  }

  // --- tabs / header -----------------------------------------------------

  switchTab(tab: 'local' | 'config' | 'docdb'): void {
    this.tab = tab;
    if (tab === 'local') this.load();
    if (tab === 'config') this.loadConfigDbs();
    if (tab === 'docdb') this.loadDocDbs();
  }

  /** Header refresh: reload the list of the visible tab. */
  refreshCurrent(): void {
    if (this.tab === 'local') this.load();
    else if (this.tab === 'config') this.loadConfigDbs();
    else this.loadDocDbs();
  }

  /** Header "New": open the local-database create dialog (switches to the local tab). */
  openCreateDialog(): void {
    this.tab = 'local';
    this.createDialog = true;
  }

  // --- local databases (existing) ----------------------------------------

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const list = await this.admin.client.domains.system.listLocalDatabases();
      this.dbs = Array.isArray(list) ? list : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.loading = false;
  }

  selectDb(d: any): void {
    this.selectedDir = coalesce(d.Directory, d.directory, '');
    this.config = null;
    this.info = null;
    this.volumes = [];
    this.editDirOpen = false;
    this.notice = '';
    this.loadDetail();
    this.loadVolumes();
  }

  async loadDetail(): Promise<void> {
    if (!this.selectedDir) return;
    try {
      this.config = await this.admin.client.domains.system.getLocalDatabase(this.selectedDir);
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  async loadVolumes(): Promise<void> {
    if (!this.selectedDir) return;
    try {
      const list = await this.admin.client.domains.system.listVolumes(this.selectedDir);
      this.volumes = Array.isArray(list) ? list : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  /** Fire the async info task and poll it until it finishes (or give up). */
  async runInfo(): Promise<void> {
    if (!this.selectedDir || this.infoBusy) return;
    this.infoBusy = true;
    this.error = '';
    try {
      const { taskId } = await this.admin.client.domains.system.databaseInfo(this.selectedDir);
      if (taskId) {
        // Poll up to 8 times, 2.5 s apart (~20 s budget).
        for (let i = 0; i < 8; i++) {
          await sleep(2500);
          const r = await this.admin.client.domains.tasks.getAsync(taskId);
          if (r && (r.State === 'Finished' || r.State === 'Failed')) {
            this.info = coalesce((r as any).Result, null);
            if (r.State === 'Failed' && r.FailureReason) this.error = r.FailureReason;
            break;
          }
        }
      }
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.infoBusy = false;
  }

  /** Fire a maintenance action; report the async task id (if any). */
  async runAction(kind: 'compact' | 'defragment' | 'integrity' | 'mount' | 'dismount'): Promise<void> {
    if (!this.selectedDir || this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      const d = this.admin.client.domains.system;
      const r =
        kind === 'compact' ? await d.compactDatabase(this.selectedDir)
        : kind === 'defragment' ? await d.defragmentDatabase(this.selectedDir)
        : kind === 'integrity' ? await d.integrityCheckDatabase(this.selectedDir)
        : kind === 'mount' ? await d.mountDatabase(this.selectedDir)
        : await d.dismountDatabase(this.selectedDir);
      if (r.taskId) {
        this.notice = this.t('databases.started') + ' ' + r.taskId + ' — ' + this.t('databases.trackAsync');
      } else {
        this.notice = this.t('databases.done');
        await this.load();
      }
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  async doTruncate(): Promise<void> {
    if (!this.selectedDir || this.truncateSize === null || this.truncateSize < 0) return;
    if (!window.confirm(this.t('databases.confirm.truncate') + ' ' + this.selectedDir + '?')) return;
    await this.fireManaged('truncate');
  }

  async doModifySize(): Promise<void> {
    if (!this.selectedDir || this.newSize === null || this.newSize <= 0) return;
    if (!window.confirm(this.t('databases.confirm.modifySize') + ' ' + this.newSize + ' MB?')) return;
    await this.fireManaged('modifysize');
  }

  async doExpandVolume(): Promise<void> {
    if (!this.selectedDir || this.volSize === null || this.volSize <= 0) return;
    if (!window.confirm(this.t('databases.confirm.expandVolume') + ' ' + this.volSize + ' MB?')) return;
    await this.fireManaged('expandvolume');
  }

  async doDelete(): Promise<void> {
    if (!this.selectedDir) return;
    if (!window.confirm(this.t('databases.confirm.delete') + ' ' + this.selectedDir + ' ?')) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.system.removeLocalDatabase(this.selectedDir);
      this.notice = this.t('databases.deleted');
      this.selectedDir = '';
      this.config = null;
      this.info = null;
      this.volumes = [];
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  /** Shared flow for the size-management actions (all async). */
  private async fireManaged(kind: 'truncate' | 'modifysize' | 'expandvolume'): Promise<void> {
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      const d = this.admin.client.domains.system;
      const r =
        kind === 'truncate' ? await d.truncateDatabase(this.selectedDir, Number(coalesce(this.truncateSize, 0)))
        : kind === 'modifysize' ? await d.modifySizeDatabase(this.selectedDir, Number(coalesce(this.newSize, 0)))
        : await d.expandVolumeDatabase(this.selectedDir, Number(coalesce(this.volSize, 0)));
      this.notice = r.taskId
        ? this.t('databases.started') + ' ' + r.taskId + ' — ' + this.t('databases.trackAsync')
        : this.t('databases.done');
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  async doCreate(): Promise<void> {
    const dir = this.newDir.trim();
    if (!dir) return;
    if (!window.confirm(this.t('databases.confirm.create') + ' ' + dir + ' ?')) return;
    this.busy = true;
    this.error = '';
    try {
      const body: { Directory: string; MaxSize?: number } = { Directory: dir };
      if (this.newMaxSize !== null) body.MaxSize = this.newMaxSize;
      await this.admin.client.domains.system.createLocalDatabase(dir, body);
      this.createDialog = false;
      this.newDir = '';
      this.newMaxSize = null;
      this.notice = this.t('databases.created');
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  // --- edit the local directory config (PUT /v2/database-dir) -------------

  /** Pre-fill the directory-config form from the loaded detail. */
  openEditDir(): void {
    const c = this.config;
    this.dirEditMaxSize = this.num(c.MaxSize !== undefined && c.MaxSize !== null ? c.MaxSize : c.maxsize);
    this.dirEditExpansionSize = this.num(coalesce(c.ExpansionSize, c.expansionsize));
    this.dirEditVolThreshold = this.num(coalesce(c.NewVolumeThreshold, c.newvolumethreshold));
    this.dirEditNewVolDir = String(coalesce(c.NewVolumeDirectory, c.newvolumedirectory, ''));
    this.dirEditKeep = this.truthy(c.NewGlobalIsKeep, c.newglobaliskeep);
    this.dirEditCollation = this.num(coalesce(c.NewGlobalCollation, c.newglobalcollation));
    this.dirEditCluster = this.truthy(c.ClusterMountMode, c.clustermountmode);
    this.dirEditReadOnly = this.truthy(c.ReadOnly, c.readonly);
    this.dirEditJournal = this.truthy(c.GlobalJournalState, c.globaljournalstate);
    this.editDirOpen = true;
  }

  /** Save the directory config (PUT /v2/database-dir; body `dir` required). */
  async saveDirConfig(): Promise<void> {
    if (!this.selectedDir || this.busy) return;
    if (!window.confirm(this.t('databases.editDir.confirm') + ' ' + this.selectedDir + ' ?')) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      const body: Partial<LocalDatabase> & { dir: string } = { dir: this.selectedDir };
      const maxSize = this.formNum(this.dirEditMaxSize);
      if (maxSize !== null) body.MaxSize = maxSize;
      const expansion = this.formNum(this.dirEditExpansionSize);
      if (expansion !== null) body.ExpansionSize = expansion;
      const volThreshold = this.formNum(this.dirEditVolThreshold);
      if (volThreshold !== null) body.NewVolumeThreshold = volThreshold;
      if (this.dirEditNewVolDir) body.NewVolumeDirectory = this.dirEditNewVolDir;
      body.NewGlobalIsKeep = this.dirEditKeep === true;
      const collation = this.formNum(this.dirEditCollation);
      if (collation !== null) body.NewGlobalCollation = collation;
      body.ClusterMountMode = this.dirEditCluster === true;
      body.ReadOnly = this.dirEditReadOnly === true;
      body.GlobalJournalState = this.dirEditJournal === true;
      await this.admin.client.domains.databases.upsertDir(this.selectedDir, body);
      this.notice = this.t('databases.editDir.saved');
      this.editDirOpen = false;
      await this.loadDetail();
      await this.load();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.busy = false;
  }

  // --- config databases (GET /v2/databases, PUT/DELETE /v2/database) ------

  async loadConfigDbs(): Promise<void> {
    try {
      const list = await this.admin.client.domains.system.listDatabases().catch(() => []);
      this.cfgDbs = Array.isArray(list) ? list : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  selectCfgDb(d: any): void {
    this.cfgSelected = coalesce(d.Name, d.name, '');
    this.cfgDetail = null;
    this.cfgFormOpen = false;
    this.cfgDeleteArmed = false;
    this.loadCfgDbDetail();
  }

  async loadCfgDbDetail(): Promise<void> {
    if (!this.cfgSelected) return;
    try {
      this.cfgDetail = await this.admin.client.domains.databases.getDatabase(this.cfgSelected);
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  /** Reset the form for a new config database. */
  openCfgDbCreate(): void {
    this.cfgFormName = '';
    this.cfgFormServer = '';
    this.cfgFormDirectory = '';
    this.cfgFormStreamLocation = '';
    this.cfgFormMountAtStartup = false;
    this.cfgFormMountRequired = false;
    this.cfgFormClusterMountMode = false;
    this.cfgFormOpen = true;
  }

  /** Pre-fill the form from the loaded detail (edit mode). */
  editCfgDb(): void {
    const d = this.cfgDetail;
    this.cfgFormName = this.cfgSelected;
    this.cfgFormServer = String(coalesce(d.Server, d.server, ''));
    this.cfgFormDirectory = String(coalesce(d.Directory, d.directory, ''));
    this.cfgFormStreamLocation = String(coalesce(d.StreamLocation, d.streamlocation, ''));
    this.cfgFormMountAtStartup = this.truthy(d.MountAtStartup, d.mountatstartup);
    this.cfgFormMountRequired = this.truthy(d.MountRequired, d.mountrequired);
    this.cfgFormClusterMountMode = this.truthy(d.ClusterMountMode, d.clustermountmode);
    this.cfgFormOpen = true;
  }

  /** Create or edit (PUT /v2/database; body `name` required). */
  async saveCfgDb(): Promise<void> {
    const name = this.cfgFormName.trim();
    if (!name || this.cfgBusy) return;
    if (!window.confirm(this.t('databases.cfgdb.confirm.save') + ' ' + name + ' ?')) return;
    this.cfgBusy = true;
    this.error = '';
    this.notice = '';
    try {
      const body: Partial<ConfigDatabase> & { name: string } = { name };
      if (this.cfgFormServer) body.Server = this.cfgFormServer;
      if (this.cfgFormDirectory) body.Directory = this.cfgFormDirectory;
      if (this.cfgFormStreamLocation) body.StreamLocation = this.cfgFormStreamLocation;
      body.MountAtStartup = this.cfgFormMountAtStartup;
      body.MountRequired = this.cfgFormMountRequired;
      body.ClusterMountMode = this.cfgFormClusterMountMode;
      await this.admin.client.domains.databases.upsertDatabase(name, body);
      this.notice = this.t('databases.cfgdb.saved');
      this.cfgFormOpen = false;
      this.cfgSelected = name;
      await this.loadConfigDbs();
      await this.loadCfgDbDetail();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.cfgBusy = false;
  }

  /** First step of the DANGEROUS double-confirm: confirm dialog, then arm. */
  armDeleteCfgDb(): void {
    if (!this.cfgSelected || this.cfgBusy) return;
    if (!window.confirm(this.t('databases.cfgdb.confirm.delete') + ' ' + this.cfgSelected + ' ?')) return;
    this.cfgDeleteArmed = true;
  }

  /** Second step of the double-confirm: actually delete (DELETE /v2/database?name). */
  async deleteCfgDb(): Promise<void> {
    if (!this.cfgSelected || !this.cfgDeleteArmed || this.cfgBusy) return;
    this.cfgBusy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.databases.removeDatabase(this.cfgSelected);
      this.notice = this.t('databases.cfgdb.deleted');
      this.cfgSelected = '';
      this.cfgDetail = null;
      this.cfgFormOpen = false;
      this.cfgDeleteArmed = false;
      await this.loadConfigDbs();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.cfgBusy = false;
  }

  // --- doc-DB applications (GET /v2/doc-dbs, PUT/DELETE /v2/doc-db) -------

  async loadDocDbs(): Promise<void> {
    try {
      const list = await this.admin.client.domains.databases.listDocDbs().catch(() => []);
      this.docDbs = Array.isArray(list) ? list : [];
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  selectDocDb(d: any): void {
    this.docSelected = coalesce(d.Name, d.name, '');
    this.docDetail = null;
    this.docFormOpen = false;
    this.loadDocDbDetail();
  }

  async loadDocDbDetail(): Promise<void> {
    if (!this.docSelected) return;
    try {
      this.docDetail = await this.admin.client.domains.databases.getDocDb(this.docSelected);
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
  }

  /** Reset the form for a new Doc-DB. */
  openDocDbCreate(): void {
    this.docFormName = '';
    this.docFormResource = '';
    this.docFormDescription = '';
    this.docFormEnabled = false;
    this.docFormOpen = true;
  }

  /** Pre-fill the form from the loaded detail (edit mode). */
  editDocDb(): void {
    const d = this.docDetail;
    this.docFormName = this.docSelected;
    this.docFormResource = String(coalesce(d.Resource, d.resource, ''));
    this.docFormDescription = String(coalesce(d.Description, d.description, ''));
    this.docFormEnabled = this.truthy(d.Enabled, d.enabled);
    this.docFormOpen = true;
  }

  /** Create or edit (PUT /v2/doc-db; body `name` required). */
  async saveDocDb(): Promise<void> {
    const name = this.docFormName.trim();
    if (!name || this.docBusy) return;
    if (!window.confirm(this.t('databases.docdb.confirm.save') + ' ' + name + ' ?')) return;
    this.docBusy = true;
    this.error = '';
    this.notice = '';
    try {
      const body: Partial<DocDBApplication> & { name: string } = { name };
      if (this.docFormResource) body.Resource = this.docFormResource;
      if (this.docFormDescription) body.Description = this.docFormDescription;
      body.Enabled = this.docFormEnabled;
      await this.admin.client.domains.databases.upsertDocDb(name, body);
      this.notice = this.t('databases.docdb.saved');
      this.docFormOpen = false;
      this.docSelected = name;
      await this.loadDocDbs();
      await this.loadDocDbDetail();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.docBusy = false;
  }

  /** Delete (DELETE /v2/doc-db?name) — single confirm. */
  async deleteDocDb(): Promise<void> {
    if (!this.docSelected || this.docBusy) return;
    if (!window.confirm(this.t('databases.docdb.confirm.delete') + ' ' + this.docSelected + ' ?')) return;
    this.docBusy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.admin.client.domains.databases.removeDocDb(this.docSelected);
      this.notice = this.t('databases.docdb.deleted');
      this.docSelected = '';
      this.docDetail = null;
      this.docFormOpen = false;
      await this.loadDocDbs();
    } catch (e) {
      this.error = this.admin.errorMessage(e);
    }
    this.docBusy = false;
  }
}
