import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../core/admin.service';
import { PermissionService, PRIV } from '../core/permission.service';
import { coalesce } from '../core/coalesce';
import { I18nService } from '../core/i18n.service';

/**
 * Security & Secrets — the high-complexity differentiator: wallets, X.509
 * credentials, OAuth 2.0, SSL, encryption, MFT/LDAP, superservers, privileged
 * routines, resources/services, SQL privileges, audit events and web auth.
 * List data typed loosely; rendered defensively with real field names.
 */
@Component({
  selector: 'app-security',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h2>{{ t('security.title') }}</h2>
          <p class="muted">{{ t('security.subtitle') }}</p>
        </div>
      </div>
      @if (error) { <div class="card"><p class="error">{{ error }}</p></div> }

      <div class="tabbar">
        @for (tb of tabs; track tb) {
          <button [class.active]="tab === tb" (click)="switchTab(tb)">{{ t('security.tab.' + tabKey(tb)) }}</button>
        }
      </div>

      <!-- Wallet -->
      @if (tab === 'Wallet') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <button (click)="loadWallet()">{{ t('common.refresh') }}</button>
            @if (canWallet) {
              <input [placeholder]="t('security.wallets.placeholder')" [(ngModel)]="walletName" />
              <button (click)="createWallet()">{{ t('security.wallets.create') }}</button>
            }
          </div>
          <table>
            <thead><tr><th>{{ t('security.wallets.col.collection') }}</th><th></th></tr></thead>
            <tbody>
              @for (c of collections; track coalesce(c.Name, c.name)) {
                <tr>
                  <td class="mono">{{ coalesce(c.Name, c.name) }}</td>
                  <td>
                    <button class="ghost" style="padding:2px 8px" (click)="loadSecrets(coalesce(c.Name, c.name))">{{ t('security.wallets.view') }}</button>
                    <button class="ghost" style="padding:2px 8px" (click)="loadWalletDetail(coalesce(c.Name, c.name))">{{ t('security.oauth2.act.detail') }}</button>
                    @if (canWallet) { <button class="ghost danger" style="padding:2px 8px" (click)="removeWallet(coalesce(c.Name, c.name))">{{ t('common.delete') }}</button> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!collections.length) { <p class="empty">{{ t('security.wallets.empty') }}</p> }
          @if (secrets.length) {
            <h3 style="margin-top:16px">{{ t('security.wallets.secretsIn') }}{{ secretCollection }}{{ t('security.wallets.secretsInEnd') }}</h3>
            <table>
              <thead><tr><th>{{ t('security.wallets.col.name') }}</th><th>{{ t('security.wallets.col.type') }}</th><th></th></tr></thead>
              <tbody>
                @for (s of secrets; track coalesce(s.Name, s.name)) {
                  <tr>
                    <td class="mono">{{ coalesce(s.Name, s.name) }}</td>
                    <td>{{ coalesce(s.Type, s.type) }}</td>
                    <td>@if (canWallet) { <button class="ghost danger" style="padding:2px 8px" (click)="removeSecret(coalesce(s.Name, s.name))">{{ t('common.delete') }}</button> }</td>
                  </tr>
                }
              </tbody>
            </table>
          }
          @if (canWallet) {
            <h3 style="margin-top:16px">{{ t('security.wallets.secretForm') }}</h3>
            <div class="form-grid">
              <div class="field"><label class="label">{{ t('security.wallets.col.name') }}</label><input [placeholder]="t('security.wallets.secretPhName')" [(ngModel)]="secretForm.name" /></div>
              <div class="field"><label class="label">{{ t('security.wallets.col.type') }}</label><input [placeholder]="t('security.wallets.secretPhType')" [(ngModel)]="secretForm.type" /></div>
              <div class="field"><label class="label">{{ t('security.wallets.ph.value') }}</label><input [placeholder]="t('security.wallets.ph.value')" [(ngModel)]="secretForm.value" /></div>
              <div class="form-actions"><button (click)="saveSecret()">{{ t('security.wallets.secretSave') }}</button></div>
            </div>
          }
          @if (walletDetail) {
            <h3 style="margin-top:16px">{{ t('security.wallets.detail') }}: {{ walletDetailName }}</h3>
            <table>
              <tbody>
                @for (e of entries(walletDetail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- X509 -->
      @if (tab === 'X509') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px"><button (click)="loadX509()">{{ t('common.refresh') }}</button></div>
          <table>
            <thead><tr><th>{{ t('security.x509.col.alias') }}</th><th>{{ t('security.x509.col.subject') }}</th><th>{{ t('security.x509.col.issuer') }}</th><th>{{ t('security.x509.col.expires') }}</th><th></th></tr></thead>
            <tbody>
              @for (c of x509; track coalesce(c.Alias, c.alias)) {
                <tr>
                  <td class="mono">{{ coalesce(c.Alias, c.alias) }}</td>
                  <td>{{ coalesce(c.Subject, c.subject) }}</td>
                  <td>{{ coalesce(c.Issuer, c.issuer) }}</td>
                  <td>{{ coalesce(c.NotAfter, c.notAfter) }}</td>
                  <td>
                    @if (canSecure) {
                      <button class="ghost" style="padding:2px 8px" (click)="loadX509Detail(coalesce(c.Alias, c.alias))">{{ t('security.oauth2.act.detail') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="loadX509Cert(coalesce(c.Alias, c.alias))">{{ t('security.x509.cert') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="openX509Edit(coalesce(c.Alias, c.alias))">{{ t('security.oauth2.act.edit') }}</button>
                      @if (x509Confirm === coalesce(c.Alias, c.alias)) {
                        <button class="ghost danger" style="padding:2px 8px" (click)="removeX509(coalesce(c.Alias, c.alias))">{{ t('common.deleteNow') }}</button>
                      } @else {
                        <button class="ghost danger" style="padding:2px 8px" (click)="x509Confirm = coalesce(c.Alias, c.alias)">{{ t('common.delete') }}</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!x509.length) { <p class="empty">{{ t('common.none') }}</p> }
          @if (canSecure) {
            <h3 style="margin-top:16px">{{ t('security.x509.create') }}</h3>
            <div class="form-grid">
              <div class="field"><label class="label">{{ t('security.x509.ph.alias') }}</label><input [(ngModel)]="x509Form.alias" /></div>
              <div class="field field--wide"><label class="label">{{ t('security.x509.ph.certFile') }}</label><textarea rows="4" class="mono" [(ngModel)]="x509Form.certificateFile"></textarea></div>
              <div class="form-actions"><button (click)="createX509()">{{ t('security.x509.create') }}</button></div>
            </div>
            <h3 style="margin-top:16px">{{ t('security.x509.edit') }}</h3>
            <div class="form-grid">
              <div class="field"><label class="label">{{ t('security.x509.ph.alias') }}</label><input [(ngModel)]="x509Form.alias" /></div>
              <div class="field"><label class="label">{{ t('security.x509.ph.description') }}</label><input [(ngModel)]="x509Form.description" /></div>
              <div class="form-actions"><button (click)="saveX509()">{{ t('security.x509.save') }}</button></div>
            </div>
          }
          @if (x509Detail) {
            <h3 style="margin-top:16px">{{ t('security.x509.detail') }}: {{ x509DetailAlias }}</h3>
            <table>
              <tbody>
                @for (e of entries(x509Detail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
          }
          @if (x509Cert) {
            <h3 style="margin-top:16px">{{ t('security.x509.cert') }}: {{ x509DetailAlias }}</h3>
            <table>
              <tbody>
                <tr><th>{{ t('security.x509.col.serial') }}</th><td class="mono">{{ coalesce(x509Cert.SerialNumber, x509Cert.serialNumber) }}</td></tr>
                <tr><th>{{ t('security.x509.col.subjectDn') }}</th><td class="mono">{{ coalesce(x509Cert.SubjectDN, x509Cert.subjectDN) }}</td></tr>
                <tr><th>{{ t('security.x509.col.issuer') }}</th><td class="mono">{{ coalesce(x509Cert.IssuerDN, x509Cert.issuerDN, x509Cert.Issuer, x509Cert.issuer) }}</td></tr>
                <tr><th>{{ t('security.x509.col.expires') }}</th><td>{{ coalesce(x509Cert.ValidityNotAfter, x509Cert.validityNotAfter, x509Cert.NotAfter, x509Cert.notAfter) }}</td></tr>
              </tbody>
            </table>
            <h3 style="margin-top:14px">{{ t('security.x509.certRaw') }}</h3>
            <pre class="mono small">{{ x509CertJson }}</pre>
          }
        </div>
      }

      <!-- OAuth2 -->
      @if (tab === 'OAuth2') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px"><button (click)="loadOauth()">{{ t('common.refresh') }}</button></div>
          <h3>{{ t('security.oauth2.servers') }}</h3>
          <table>
            <thead><tr><th>{{ t('security.oauth2.col.serverId') }}</th><th>{{ t('security.oauth2.col.redirectUri') }}</th><th></th></tr></thead>
            <tbody>
              @for (d of oauthDefs; track coalesce(d.ServerId, d.serverId, $index)) {
                <tr>
                  <td class="mono">{{ coalesce(d.ServerId, d.serverId) }}</td>
                  <td class="mono">{{ first(coalesce(d.RedirectURI, d.redirectUris)) }}</td>
                  <td>
                    <button class="ghost" style="padding:2px 8px" (click)="loadOAuthDefDetail(coalesce(d.ServerId, d.serverId))">{{ t('security.oauth2.act.detail') }}</button>
                    @if (canOauth2Server) {
                      <button class="ghost" style="padding:2px 8px" (click)="openOAuthDefEdit(coalesce(d.ServerId, d.serverId))">{{ t('security.oauth2.act.edit') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="initialOAuth2Token(coalesce(d.ServerId, d.serverId))">{{ t('security.oauth2.act.initialToken') }}</button>
                      @if (oauthDefConfirm === coalesce(d.ServerId, d.serverId)) {
                        <button class="ghost danger" style="padding:2px 8px" (click)="removeOAuthDef(coalesce(d.ServerId, d.serverId))">{{ t('common.deleteNow') }}</button>
                      } @else {
                        <button class="ghost danger" style="padding:2px 8px" (click)="oauthDefConfirm = coalesce(d.ServerId, d.serverId)">{{ t('common.delete') }}</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (oauthDefDetail) {
            <h3 style="margin-top:16px">{{ t('security.oauth2.defDetail') }}: {{ oauthDefDetailId }}</h3>
            <table>
              <tbody>
                @for (e of entries(oauthDefDetail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
          }
          @if (canOauth2Server) {
            <h3 style="margin-top:16px">{{ t('security.oauth2.defEdit') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.oauth2.ph.issuerEndpoint') }}</label>
                <input [(ngModel)]="oauthDefForm.IssuerEndpoint" />
                <label class="label">{{ t('security.oauth2.ph.description') }}</label>
                <input [(ngModel)]="oauthDefForm.Description" />
              </div>
              <div>
                <label class="label">{{ t('security.oauth2.ph.ssl') }}</label>
                <input [(ngModel)]="oauthDefForm.SSLConfiguration" />
                <button style="margin-top:8px" (click)="saveOAuthDef()">{{ t('security.oauth2.save') }}</button>
              </div>
            </div>
          }

          <h3 style="margin-top:16px">{{ t('security.oauth2.clients') }}</h3>
          @if (canOauth2Client) {
            <div class="toolbar" style="margin-bottom:8px">
              <select [(ngModel)]="oauthNewClient.ClientType">
                <option value="public">public</option>
                <option value="confidential">confidential</option>
                <option value="resource">resource</option>
              </select>
              <input [placeholder]="t('security.oauth2.ph.clientName')" [(ngModel)]="oauthNewClient.Name" />
              <button (click)="createOAuth2Client()">{{ t('security.oauth2.newClient') }}</button>
            </div>
          }
          <table>
            <thead><tr><th>{{ t('security.oauth2.col.client') }}</th><th>{{ t('security.oauth2.col.type') }}</th><th>{{ t('security.oauth2.col.defaultScope') }}</th><th></th></tr></thead>
            <tbody>
              @for (c of oauthClients; track coalesce(c.Name, c.name, $index)) {
                <tr>
                  <td class="mono">{{ coalesce(c.Name, c.name) }}</td>
                  <td>{{ coalesce(c.ClientType, c.clientType) }}</td>
                  <td>{{ coalesce(c.DefaultScope, c.defaultScope) }}</td>
                  <td>
                    <button class="ghost" style="padding:2px 8px" (click)="loadOAuthClientDetail(oauthClientId(c))">{{ t('security.oauth2.act.detail') }}</button>
                    @if (canOauth2Client) {
                      <button class="ghost" style="padding:2px 8px" (click)="openOAuthClientEdit(oauthClientId(c))">{{ t('security.oauth2.act.edit') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="rotateOAuthClientSecret(oauthClientId(c))">{{ t('security.oauth2.act.secret') }}</button>
                      @if (oauthClientConfirm === oauthClientId(c)) {
                        <button class="ghost danger" style="padding:2px 8px" (click)="removeOAuthClient(oauthClientId(c))">{{ t('common.deleteNow') }}</button>
                      } @else {
                        <button class="ghost danger" style="padding:2px 8px" (click)="oauthClientConfirm = oauthClientId(c)">{{ t('common.delete') }}</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (oauthClientDetail) {
            <h3 style="margin-top:16px">{{ t('security.oauth2.clientDetail') }}: {{ oauthClientDetailId }}</h3>
            <table>
              <tbody>
                @for (e of entries(oauthClientDetail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
            @if (canOauth2Client) {
              <h3 style="margin-top:14px">{{ t('security.oauth2.clientConfigEdit') }}</h3>
              <textarea rows="6" class="mono" [(ngModel)]="oauthClientJson"></textarea>
              <button style="margin-top:8px" (click)="saveOAuthClient()">{{ t('security.oauth2.save') }}</button>
            }
          }

          <h3 style="margin-top:16px">{{ t('security.oauth2.resourceServers') }}</h3>
          <table>
            <thead><tr><th>{{ t('security.oauth2.col.name') }}</th><th>{{ t('security.oauth2.col.enabled') }}</th><th>{{ t('security.oauth2.col.issuerEndpoint') }}</th><th></th></tr></thead>
            <tbody>
              @for (r of oauthResources; track coalesce(r.Name, r.name, $index)) {
                <tr>
                  <td class="mono">{{ coalesce(r.Name, r.name) }}</td>
                  <td>{{ coalesce(r.Enabled, r.enabled) }}</td>
                  <td class="mono">{{ coalesce(r.IssuerEndpoint, r.issuerEndpoint) }}</td>
                  <td>
                    <button class="ghost" style="padding:2px 8px" (click)="loadOAuthResourceDetail(coalesce(r.Name, r.name))">{{ t('security.oauth2.act.detail') }}</button>
                    @if (canOauth2Client) {
                      <button class="ghost" style="padding:2px 8px" (click)="openOAuthResourceEdit(coalesce(r.Name, r.name))">{{ t('security.oauth2.act.edit') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="rotateOAuthResourceSecret(coalesce(r.Name, r.name))">{{ t('security.oauth2.act.secret') }}</button>
                      @if (oauthResourceConfirm === coalesce(r.Name, r.name)) {
                        <button class="ghost danger" style="padding:2px 8px" (click)="removeOAuthResource(coalesce(r.Name, r.name))">{{ t('common.deleteNow') }}</button>
                      } @else {
                        <button class="ghost danger" style="padding:2px 8px" (click)="oauthResourceConfirm = coalesce(r.Name, r.name)">{{ t('common.delete') }}</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (oauthResourceDetail) {
            <h3 style="margin-top:16px">{{ t('security.oauth2.resourceDetail') }}: {{ oauthResourceDetailName }}</h3>
            <table>
              <tbody>
                @for (e of entries(oauthResourceDetail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
            @if (canOauth2Client) {
              <h3 style="margin-top:14px">{{ t('security.oauth2.clientConfigEdit') }}</h3>
              <textarea rows="6" class="mono" [(ngModel)]="oauthResourceJson"></textarea>
              <button style="margin-top:8px" (click)="saveOAuthResource()">{{ t('security.oauth2.save') }}</button>
            }
          }

          <h3 style="margin-top:16px">{{ t('security.oauth2.clientConfigs') }}</h3>
          <div class="toolbar" style="margin-bottom:8px">
            <select [(ngModel)]="selectedServerId" (change)="loadClientConfigs()">
              <option value="">{{ t('security.oauth2.selectServer') }}</option>
              @for (d of oauthDefs; track coalesce(d.ServerId, d.serverId, $index)) {
                <option [value]="coalesce(d.ServerId, d.serverId)">{{ coalesce(d.ServerId, d.serverId) }}</option>
              }
            </select>
          </div>
          @if (oauthClientConfigs.length) {
            <table>
              <thead><tr><th>{{ t('security.oauth2.col.client') }}</th><th>{{ t('security.oauth2.col.type') }}</th><th>{{ t('security.oauth2.col.defaultScope') }}</th></tr></thead>
              <tbody>
                @for (c of oauthClientConfigs; track coalesce(c.Name, c.name, $index)) {
                  <tr><td class="mono">{{ coalesce(c.Name, c.name) }}</td><td>{{ coalesce(c.ClientType, c.clientType) }}</td><td>{{ coalesce(c.DefaultScope, c.defaultScope) }}</td></tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('security.oauth2.clientConfigsEmpty') }}</p> }

          <h3 style="margin-top:16px">{{ t('security.oauth2.clientConfig') }}</h3>
          <div class="toolbar" style="margin-bottom:8px">
            <input [placeholder]="t('security.oauth2.ph.applicationName')" [(ngModel)]="oauthClientConfigName" />
            <button (click)="loadOAuthClientConfig()">{{ t('security.oauth2.act.detail') }}</button>
            @if (canOauth2Registration) {
              <button (click)="registerOAuth2Client()">{{ t('security.oauth2.act.register') }}</button>
              <button (click)="rotateOAuth2Keys()">{{ t('security.oauth2.act.rotateKeys') }}</button>
              <button (click)="createOAuth2Secrets()">{{ t('security.oauth2.act.secrets') }}</button>
            }
          </div>
          @if (oauthClientConfigDetail) {
            <table>
              <tbody>
                @for (e of entries(oauthClientConfigDetail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
            @if (canOauth2Client) {
              <h3 style="margin-top:14px">{{ t('security.oauth2.clientConfigEdit') }}</h3>
              <textarea rows="6" class="mono" [(ngModel)]="oauthClientConfigJson"></textarea>
              <div class="toolbar" style="margin-top:8px">
                <button (click)="saveOAuthClientConfig()">{{ t('security.oauth2.save') }}</button>
                @if (oauthClientConfigConfirm === oauthClientConfigName) {
                  <button class="ghost danger" (click)="removeOAuthClientConfig()">{{ t('common.deleteNow') }}</button>
                } @else {
                  <button class="ghost danger" (click)="oauthClientConfigConfirm = oauthClientConfigName">{{ t('common.delete') }}</button>
                }
              </div>
            }
          } @else { <p class="empty">{{ t('security.oauth2.clientConfigEmpty') }}</p> }

          <h3 style="margin-top:16px">{{ t('security.oauth2.mappings') }}</h3>
          <div class="toolbar" style="margin-bottom:8px">
            <select [(ngModel)]="selectedService" (change)="loadMappings()">
              <option value="">{{ t('security.oauth2.selectService') }}</option>
              @for (r of oauthResources; track coalesce(r.Name, r.name, $index)) {
                <option [value]="coalesce(r.Name, r.name)">{{ coalesce(r.Name, r.name) }}</option>
              }
            </select>
          </div>
          @if (oauthMappings.length) {
            <table>
              <thead><tr><th>{{ t('security.oauth2.col.resource') }}</th></tr></thead>
              <tbody>
                @for (m of oauthMappings; track coalesce(m.Resource, m.resource, $index)) {
                  <tr><td class="mono">{{ coalesce(m.Resource, m.resource) }}</td></tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('security.oauth2.mappingsEmpty') }}</p> }

          <h3 style="margin-top:16px">{{ t('security.oauth2.mappingBy') }}</h3>
          <div class="toolbar" style="margin-bottom:8px">
            <input [placeholder]="t('security.oauth2.ph.key')" [(ngModel)]="oauthMappingKey" />
            <button (click)="loadOAuthMapping()">{{ t('security.oauth2.act.detail') }}</button>
          </div>
          @if (oauthMappingDetail) {
            <table>
              <tbody>
                @for (e of entries(oauthMappingDetail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
            @if (canOauth2Client) {
              <h3 style="margin-top:14px">{{ t('security.oauth2.clientConfigEdit') }}</h3>
              <textarea rows="4" class="mono" [(ngModel)]="oauthMappingJson"></textarea>
              <div class="toolbar" style="margin-top:8px">
                <button (click)="saveOAuthMapping()">{{ t('security.oauth2.save') }}</button>
                @if (oauthMappingConfirm === oauthMappingKey) {
                  <button class="ghost danger" (click)="removeOAuthMapping()">{{ t('common.deleteNow') }}</button>
                } @else {
                  <button class="ghost danger" (click)="oauthMappingConfirm = oauthMappingKey">{{ t('common.delete') }}</button>
                }
              </div>
            }
          } @else { <p class="empty">{{ t('security.oauth2.mappingEmpty') }}</p> }

          <h3 style="margin-top:16px">{{ t('security.oauth2.asConfig') }}</h3>
          <div class="toolbar" style="margin-bottom:8px">
            <button (click)="loadOAuthAs()">{{ t('security.oauth2.asLoad') }}</button>
          </div>
          @if (!oauthAsConfigured) { <p class="muted">{{ t('security.oauth2.asNotConfigured') }}</p> }
          <div class="grid cols-2">
            <div>
              <label class="label">{{ t('security.oauth2.asIssuer') }}</label>
              <input [(ngModel)]="oauthAsForm.IssuerEndpoint" />
              <label class="label">{{ t('security.oauth2.asDescription') }}</label>
              <input [(ngModel)]="oauthAsForm.Description" />
              <label class="label">{{ t('security.oauth2.asTokenInterval') }}</label>
              <input [(ngModel)]="oauthAsForm.AccessTokenInterval" />
            </div>
            <div>
              <label class="label">{{ t('security.oauth2.asScopes') }}</label>
              <input [(ngModel)]="oauthAsForm.SupportedScopes" />
              <label class="label">{{ t('security.oauth2.asSsl') }}</label>
              <input [(ngModel)]="oauthAsForm.SSLConfiguration" />
              <label class="label">{{ t('security.oauth2.asSigning') }}</label>
              <input [(ngModel)]="oauthAsForm.SigningAlgorithm" />
            </div>
          </div>
          @if (canOauth2Server) {
            <div class="toolbar" style="margin-top:8px">
              <button (click)="saveOAuthAs()">{{ oauthAsConfigured ? t('security.oauth2.asSave') : t('security.oauth2.asActivate') }}</button>
              @if (oauthAsConfigured) {
                @if (oauthAsConfirm) {
                  <button class="ghost danger" (click)="stopOAuthAs()">{{ t('common.deleteNow') }}</button>
                } @else {
                  <button class="ghost danger" (click)="oauthAsConfirm = true">{{ t('security.oauth2.asStop') }}</button>
                }
              }
            </div>
            <h3 style="margin-top:16px">{{ t('security.oauth2.asChangePassword') }}</h3>
            <div class="toolbar">
              <input [placeholder]="t('security.oauth2.ph.serverPassword')" [(ngModel)]="oauthAsPassword" />
              <button (click)="changeOAuthAsPassword()">{{ t('security.oauth2.asChangePassword') }}</button>
            </div>
          }
        </div>
      }

      <!-- SSL -->
      @if (tab === 'SSL') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <button (click)="loadSsl()">{{ t('common.refresh') }}</button>
            @if (canSecure) { <button (click)="sslFormOpen = !sslFormOpen">{{ t('security.ssl.create') }}</button> }
          </div>
          @if (canSecure && sslFormOpen) {
            <h3>{{ t('security.ssl.create') }}</h3>
            <div class="form-grid">
              <div class="field"><label class="label">{{ t('security.ssl.ph.name') }}</label><input [(ngModel)]="sslForm.name" /></div>
              <div class="field"><label class="label">{{ t('security.ssl.f.type') }}</label>
                <select [(ngModel)]="sslForm.type">
                  <option [ngValue]="0">{{ t('security.ssl.type.client') }}</option>
                  <option [ngValue]="1">{{ t('security.ssl.type.server') }}</option>
                </select>
              </div>
              <div class="field"><label class="label">{{ t('security.ssl.f.verifyPeer') }}</label>
                <select [(ngModel)]="sslForm.verifyPeer">
                  <option [ngValue]="0">{{ t('security.ssl.verifyPeer.0') }}</option>
                  <option [ngValue]="1">{{ t('security.ssl.verifyPeer.1') }}</option>
                  <option [ngValue]="3">{{ t('security.ssl.verifyPeer.3') }}</option>
                </select>
              </div>
              <div class="field"><label class="label">{{ t('security.ssl.f.enabled') }}</label><input type="checkbox" [(ngModel)]="sslForm.enabled" /></div>
            </div>
            <div class="form-actions">
              <button (click)="createSsl()" [disabled]="!sslForm.name.trim()">{{ t('security.ssl.create') }}</button>
              <button class="ghost" (click)="sslFormOpen = false">{{ t('common.cancel') }}</button>
            </div>
          }
          <table>
            <thead><tr><th>{{ t('security.ssl.col.name') }}</th><th>{{ t('security.ssl.col.type') }}</th><th>{{ t('security.ssl.col.enabled') }}</th><th>{{ t('security.ssl.col.description') }}</th><th></th></tr></thead>
            <tbody>
              @for (s of ssl; track coalesce(s.Name, s.name)) {
                <tr>
                  <td class="mono">{{ coalesce(s.Name, s.name) }}</td>
                  <td>{{ coalesce(s.Type, s.type) }}</td>
                  <td><span class="badge" [class.ok]="truthySsl(s.Enabled, s.enabled)">{{ truthySsl(s.Enabled, s.enabled) ? t('common.on') : t('common.off') }}</span></td>
                  <td class="small" [title]="coalesce(s.Description, s.description)">{{ coalesce(s.Description, s.description) }}</td>
                  <td>
                    @if (canSecure) {
                      <button class="ghost" style="padding:2px 8px" (click)="testSsl(coalesce(s.Name, s.name))">{{ t('security.ssl.test') }}</button>
                      <button class="ghost danger" style="padding:2px 8px" (click)="removeSsl(coalesce(s.Name, s.name))">{{ t('common.delete') }}</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!ssl.length) { <p class="empty">{{ t('common.none') }}</p> }
        </div>
      }

      <!-- Encryption -->
      @if (tab === 'Encryption') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px"><button (click)="loadEncryption()">{{ t('common.refresh') }}</button></div>
          @if (encryption) {
            <table>
              <tbody>
                <tr><th>{{ t('security.encryption.startMode') }}</th><td>{{ coalesce(encryption.DBEncStartMode, encryption.encryptionEnabled) }}</td></tr>
                <tr><th>{{ t('security.encryption.journal') }}</th><td>{{ encryption.DBEncJournal }}</td></tr>
                <tr><th>{{ t('security.encryption.irisSecurity') }}</th><td>{{ encryption.DBEncIRISSecurity }}</td></tr>
                <tr><th>{{ t('security.encryption.irisTemp') }}</th><td>{{ encryption.DBEncIRISTemp }}</td></tr>
                <tr><th>{{ t('security.encryption.defaultKey') }}</th><td class="mono">{{ coalesce(encryption.DBEncDefaultKeyID, encryption.defaultKeyID) || t('common.none') }}</td></tr>
                <tr><th>{{ t('security.encryption.journalKey') }}</th><td class="mono">{{ coalesce(encryption.DBEncJournalKeyID, encryption.journalKeyID) || t('common.none') }}</td></tr>
              </tbody>
            </table>
          } @else { <p class="muted">{{ t('common.loading') }}</p> }
          @if (canSecure) {
            <h3 style="margin-top:16px">{{ t('security.encryption.editSettings') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.encryption.set.startMode') }}</label>
                <input [(ngModel)]="encSettingsForm.DBEncStartMode" />
                <label class="label">{{ t('security.encryption.set.journal') }}</label>
                <input [(ngModel)]="encSettingsForm.DBEncJournal" />
                <label class="label">{{ t('security.encryption.set.irisSecurity') }}</label>
                <input [(ngModel)]="encSettingsForm.DBEncIRISSecurity" />
              </div>
              <div>
                <label class="label">{{ t('security.encryption.set.irisTemp') }}</label>
                <input [(ngModel)]="encSettingsForm.DBEncIRISTemp" />
                <label class="label">{{ t('security.encryption.set.auditEncrypt') }}</label>
                <input [(ngModel)]="encSettingsForm.AuditEncrypt" />
                <label class="label">{{ t('security.encryption.set.kmipServer') }}</label>
                <input [(ngModel)]="encSettingsForm.DBEncStartKMIPServer" />
                <label class="label">{{ t('security.encryption.set.keyFile') }}</label>
                <input [(ngModel)]="encSettingsForm.DBEncStartKeyFile" />
                <button style="margin-top:8px" (click)="saveEncryptionSettings()">{{ t('security.encryption.save') }}</button>
              </div>
            </div>
            <h3 style="margin-top:16px">{{ t('security.encryption.newKey') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.encryption.ph.file') }}</label>
                <input [(ngModel)]="encNewKey.File" />
                <label class="label">{{ t('security.encryption.ph.adminName') }}</label>
                <input [(ngModel)]="encNewKey.AdminName" />
                <label class="label">{{ t('security.encryption.ph.keyLen') }}</label>
                <input [(ngModel)]="encNewKey.KeyLen" />
              </div>
              <div>
                <label class="label">{{ t('security.encryption.ph.adminPassword') }}</label>
                <input [(ngModel)]="encNewKey.AdminPassword" />
                <label class="label">{{ t('security.encryption.ph.description') }}</label>
                <input [(ngModel)]="encNewKey.Description" />
                <button style="margin-top:8px" (click)="createEncryptionKey()">{{ t('security.encryption.keyCreate') }}</button>
              </div>
            </div>
            <h3 style="margin-top:16px">{{ t('security.encryption.activate') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.encryption.ph.action') }}</label>
                <input [(ngModel)]="encActivate.Action" />
                <label class="label">{{ t('security.encryption.ph.adminName') }}</label>
                <input [(ngModel)]="encActivate.AdminName" />
              </div>
              <div>
                <label class="label">{{ t('security.encryption.ph.adminPassword') }}</label>
                <input [(ngModel)]="encActivate.AdminPassword" />
                <button style="margin-top:8px" (click)="activateEncryptionKey()">{{ t('security.encryption.activateBtn') }}</button>
              </div>
            </div>
            <h3 style="margin-top:16px">{{ t('security.encryption.fileAdmin') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.encryption.ph.file') }}</label>
                <input [(ngModel)]="encFileAdmin.file" />
                <label class="label">{{ t('security.encryption.ph.adminName') }}</label>
                <input [(ngModel)]="encFileAdmin.AdminName" />
              </div>
              <div>
                <label class="label">{{ t('security.encryption.ph.adminPassword') }}</label>
                <input [(ngModel)]="encFileAdmin.AdminPassword" />
                <div class="toolbar" style="margin-top:8px">
                  <button (click)="addEncryptionFileAdmin()">{{ t('security.encryption.fileAdminAdd') }}</button>
                  @if (encAdminConfirm) {
                    <button class="ghost danger" (click)="removeEncryptionFileAdmin()">{{ t('common.deleteNow') }}</button>
                  } @else {
                    <button class="ghost danger" (click)="encAdminConfirm = true">{{ t('security.encryption.fileAdminRemove') }}</button>
                  }
                </div>
              </div>
            </div>
            <h3 style="margin-top:16px">{{ t('security.encryption.fileKey') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.encryption.ph.file') }}</label>
                <input [(ngModel)]="encFileKey.file" />
                <div class="toolbar" style="margin-top:8px">
                  <button (click)="addEncryptionFileKey()">{{ t('security.encryption.fileKeyAdd') }}</button>
                  @if (encKeyConfirm) {
                    <button class="ghost danger" (click)="removeEncryptionFileKey()">{{ t('common.deleteNow') }}</button>
                  } @else {
                    <button class="ghost danger" (click)="encKeyConfirm = true">{{ t('security.encryption.fileKeyRemove') }}</button>
                  }
                </div>
              </div>
            </div>
          }
          <h3 style="margin-top:16px">{{ t('security.encryption.keys') }}</h3>
          @if (encKeys.length) {
            <table>
              <thead><tr><th>{{ t('security.encryption.col.keyId') }}</th><th>{{ t('security.encryption.col.keyLen') }}</th><th>{{ t('security.encryption.col.isDefault') }}</th></tr></thead>
              <tbody>
                @for (k of encKeys; track coalesce(k.Id, k.id, $index)) {
                  <tr>
                    <td class="mono">{{ coalesce(k.Id, k.id) }}</td>
                    <td>{{ coalesce(k.KeyLen, k.keyLen) }}</td>
                    <td><span class="badge" [class.ok]="truthy(k.IsDefault, k.isDefault)">{{ truthy(k.IsDefault, k.isDefault) ? t('common.on') : t('common.off') }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('security.encryption.keysEmpty') }}</p> }
          <h3 style="margin-top:16px">{{ t('security.encryption.dataElementKeys') }}</h3>
          @if (dataElementKeys.length) {
            <table>
              <thead><tr><th>{{ t('security.encryption.col.keyId') }}</th></tr></thead>
              <tbody>
                @for (k of dataElementKeys; track coalesce(k.Id, k.id, $index)) {
                  <tr><td class="mono">{{ coalesce(k.Id, k.id) }}</td></tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('security.encryption.dataElementKeysEmpty') }}</p> }
        </div>
      }

      <!-- FS Access -->
      @if (tab === 'FS Access') {
        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('security.fsAccess.purposes') }}</h2>
              <span class="spacer"></span>
              <button (click)="loadFsAccess()">{{ t('common.refresh') }}</button>
            </div>
            @if (fsPurposes.length) {
              <table>
                <thead><tr><th>{{ t('security.fsAccess.col.purpose') }}</th><th>{{ t('security.fsAccess.col.restricted') }}</th></tr></thead>
                <tbody>
                  @for (p of fsPurposes; track coalesce(p.Purpose, p.purpose, $index)) {
                    <tr (click)="selectFsPurpose(coalesce(p.Purpose, p.purpose))" [style.background]="fsSelectedPurpose === (coalesce(p.Purpose, p.purpose)) ? 'var(--bg-elev-2)' : ''">
                      <td class="mono">{{ coalesce(p.Purpose, p.purpose) }}</td>
                      <td><span class="badge" [class.ok]="!truthy(p.Restricted, p.restricted)">{{ truthy(p.Restricted, p.restricted) ? t('common.on') : t('common.off') }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else { <p class="empty">{{ t('security.fsAccess.purposesEmpty') }}</p> }
          </div>
          <div class="card">
            <h2>{{ t('security.fsAccess.detail') }}</h2>
            @if (!fsSelectedPurpose) {
              <p class="empty">{{ t('security.fsAccess.select') }}</p>
            } @else {
              <p class="muted mono">{{ fsSelectedPurpose }}</p>
              @if (fsPurposeDetail) {
                <table>
                  <tbody>
                    <tr><th>{{ t('security.fsAccess.col.restricted') }}</th><td><span class="badge" [class.ok]="!truthy(fsPurposeDetail.Restricted, fsPurposeDetail.restricted)">{{ truthy(fsPurposeDetail.Restricted, fsPurposeDetail.restricted) ? t('common.on') : t('common.off') }}</span></td></tr>
                  </tbody>
                </table>
                @if (fsPurposeDetail.PurposePaths && fsPurposeDetail.PurposePaths.length) {
                  <h3 style="margin-top:14px">{{ t('security.fsAccess.paths') }}</h3>
                  <table>
                    <thead><tr><th>{{ t('security.fsAccess.col.rootPath') }}</th></tr></thead>
                    <tbody>
                      @for (p of fsPurposeDetail.PurposePaths; track $index) {
                        <tr><td class="mono">{{ coalesce(p.RootPath, p.rootPath) }}</td></tr>
                      }
                    </tbody>
                  </table>
                }
              }
            }
          </div>
        </div>
      }

      <!-- MFT / LDAP -->
      @if (tab === 'MFT / LDAP') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px"><button (click)="loadMftLdap()">{{ t('common.refresh') }}</button></div>
          <h3>{{ t('security.mft.connections') }}</h3>
          <table>
            <thead><tr><th>{{ t('security.mft.col.name') }}</th><th>{{ t('security.mft.col.service') }}</th><th>{{ t('security.mft.col.authorized') }}</th><th></th></tr></thead>
            <tbody>
              @for (m of mft; track coalesce(m.Name, m.name, $index)) {
                <tr>
                  <td class="mono">{{ coalesce(m.Name, m.name) }}</td>
                  <td>{{ coalesce(m.Service, m.service) }}</td>
                  <td>{{ coalesce(m.IsAuthorized, m.isAuthorized) }}</td>
                  <td>
                    <button class="ghost" style="padding:2px 8px" (click)="loadMftDetail(coalesce(m.Name, m.name))">{{ t('security.mft.act.detail') }}</button>
                    @if (canSecure) {
                      <button class="ghost" style="padding:2px 8px" (click)="openMftEdit(coalesce(m.Name, m.name))">{{ t('security.mft.act.edit') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="revokeMftToken(coalesce(m.Name, m.name))">{{ t('security.mft.act.revoke') }}</button>
                      @if (mftConfirm === coalesce(m.Name, m.name)) {
                        <button class="ghost danger" style="padding:2px 8px" (click)="removeMft(coalesce(m.Name, m.name))">{{ t('common.deleteNow') }}</button>
                      } @else {
                        <button class="ghost danger" style="padding:2px 8px" (click)="mftConfirm = coalesce(m.Name, m.name)">{{ t('common.delete') }}</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!mft.length) { <p class="empty">{{ t('common.none') }}</p> }
          @if (mftDetail) {
            <h3 style="margin-top:16px">{{ t('security.mft.detail') }}: {{ mftDetailName }}</h3>
            <table>
              <tbody>
                @for (e of entries(mftDetail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
          }
          @if (canSecure) {
            <h3 style="margin-top:16px">{{ t('security.mft.editForm') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.mft.ph.connection') }}</label>
                <input [(ngModel)]="mftForm.connection" />
                <label class="label">{{ t('security.mft.ph.service') }}</label>
                <select [(ngModel)]="mftForm.Service">
                  <option value="Box">Box</option>
                  <option value="Dropbox">Dropbox</option>
                  <option value="Kiteworks">Kiteworks</option>
                </select>
                <label class="label">{{ t('security.mft.ph.url') }}</label>
                <input [(ngModel)]="mftForm.URL" />
              </div>
              <div>
                <label class="label">{{ t('security.mft.ph.username') }}</label>
                <input [(ngModel)]="mftForm.Username" />
                <label class="label">{{ t('security.mft.ph.sslConfiguration') }}</label>
                <input [(ngModel)]="mftForm.SSLConfiguration" />
                <label class="label">{{ t('security.mft.ph.applicationName') }}</label>
                <input [(ngModel)]="mftForm.ApplicationName" />
                <button style="margin-top:8px" (click)="saveMft()">{{ t('security.mft.save') }}</button>
              </div>
            </div>
            <h3 style="margin-top:16px">{{ t('security.mft.authUrl') }}</h3>
            <div class="toolbar">
              <input [placeholder]="t('security.mft.ph.connection')" [(ngModel)]="mftAuth.connection" />
              <input [placeholder]="t('security.mft.ph.scope')" [(ngModel)]="mftAuth.scope" />
              <input [placeholder]="t('security.mft.ph.redirect')" [(ngModel)]="mftAuth.redirect" />
              <button (click)="loadMftAuthUrl()">{{ t('security.mft.act.authUrl') }}</button>
            </div>
            @if (mftAuthResult) { <p class="mono small">{{ mftAuthResult }}</p> }
          }
          <h3 style="margin-top:16px">{{ t('security.ldap.configurations') }}</h3>
          <table>
            <thead><tr><th>{{ t('security.ldap.col.name') }}</th><th>{{ t('security.ldap.col.description') }}</th><th>{{ t('security.ldap.col.enabled') }}</th><th></th></tr></thead>
            <tbody>
              @for (l of ldap; track coalesce(l.Name, l.name, $index)) {
                <tr>
                  <td class="mono">{{ coalesce(l.Name, l.name) }}</td>
                  <td>{{ coalesce(l.Description, l.description) }}</td>
                  <td><span class="badge" [class.ok]="truthy(l.Enabled, l.enabled)">{{ truthy(l.Enabled, l.enabled) ? t('common.on') : t('common.off') }}</span></td>
                  <td>
                    <button class="ghost" style="padding:2px 8px" (click)="loadLdapDetail(coalesce(l.Name, l.name))">{{ t('security.ldap.act.detail') }}</button>
                    @if (canSecure) {
                      <button class="ghost" style="padding:2px 8px" (click)="openLdapEdit(coalesce(l.Name, l.name))">{{ t('security.ldap.act.edit') }}</button>
                      <button class="ghost" style="padding:2px 8px" (click)="prefillLdapSearch(coalesce(l.Name, l.name))">{{ t('security.ldap.act.searchPassword') }}</button>
                      @if (ldapConfirm === coalesce(l.Name, l.name)) {
                        <button class="ghost danger" style="padding:2px 8px" (click)="removeLdap(coalesce(l.Name, l.name))">{{ t('common.deleteNow') }}</button>
                      } @else {
                        <button class="ghost danger" style="padding:2px 8px" (click)="ldapConfirm = coalesce(l.Name, l.name)">{{ t('common.delete') }}</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!ldap.length) { <p class="empty">{{ t('common.none') }}</p> }
          @if (ldapDetail) {
            <h3 style="margin-top:16px">{{ t('security.ldap.detail') }}: {{ ldapDetailName }}</h3>
            <table>
              <tbody>
                @for (e of entries(ldapDetail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
          }
          @if (canSecure) {
            <h3 style="margin-top:16px">{{ t('security.ldap.editForm') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.ldap.ph.name') }}</label>
                <input [(ngModel)]="ldapForm.name" />
                <label class="label">{{ t('security.ldap.ph.description') }}</label>
                <input [(ngModel)]="ldapForm.Description" />
              </div>
              <div>
                <label class="label">{{ t('security.ldap.ph.host') }}</label>
                <input [(ngModel)]="ldapForm.Host" />
                <label class="label">{{ t('security.ldap.ph.baseDn') }}</label>
                <input [(ngModel)]="ldapForm.LDAPBaseDN" />
                <button style="margin-top:8px" (click)="saveLdap()">{{ t('security.ldap.save') }}</button>
              </div>
            </div>
            <h3 style="margin-top:16px">{{ t('security.ldap.searchPassword') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.ldap.ph.name') }}</label>
                <input [(ngModel)]="ldapSearchPassword.name" />
                <label class="label">{{ t('security.ldap.ph.password') }}</label>
                <input [(ngModel)]="ldapSearchPassword.Password" />
                <button style="margin-top:8px" (click)="searchLdapPassword()">{{ t('security.ldap.act.searchPassword') }}</button>
              </div>
              <div>
                <label class="label">{{ t('security.ldap.searchResult') }}</label>
                <p class="mono small">{{ ldapSearchResult || t('common.none') }}</p>
              </div>
            </div>
            <h3 style="margin-top:16px">{{ t('security.ldap.testLogin') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.ldap.ph.username') }}</label>
                <input [(ngModel)]="ldapTest.Username" />
                <label class="label">{{ t('security.ldap.ph.password') }}</label>
                <input [(ngModel)]="ldapTest.Password" />
                <button style="margin-top:8px" (click)="testLdapLogin()">{{ t('security.ldap.testLogin') }}</button>
              </div>
              <div>
                <label class="label">{{ t('security.ldap.searchResult') }}</label>
                <p class="mono small">{{ ldapTestResult || t('common.none') }}</p>
              </div>
            </div>
          }
        </div>
      }

      <!-- Superservers -->
      @if (tab === 'Superservers') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px"><button (click)="loadSuperservers()">{{ t('common.refresh') }}</button></div>
          <table>
            <thead><tr><th>{{ t('security.superservers.col.port') }}</th><th>{{ t('security.superservers.col.bindAddress') }}</th><th>{{ t('security.superservers.col.enabled') }}</th><th>{{ t('security.superservers.col.systemDefault') }}</th><th></th></tr></thead>
            <tbody>
              @for (s of superservers; track coalesce(s.Port, s.port, $index)) {
                <tr>
                  <td>{{ coalesce(s.Port, s.port) }}</td>
                  <td class="mono">{{ coalesce(s.BindAddress, s.bindAddress) }}</td>
                  <td><span class="badge" [class.ok]="!!coalesce(s.Enabled, s.enabled)">{{ coalesce(s.Enabled, s.enabled) ? t('security.superservers.enabledYes') : t('security.superservers.enabledNo') }}</span></td>
                  <td><span class="badge" [class.ok]="!!coalesce(s.SystemDefault, s.systemDefault)">{{ coalesce(s.SystemDefault, s.systemDefault) ? t('security.superservers.defaultYes') : t('security.superservers.defaultNo') }}</span></td>
                  <td>
                    <button class="ghost" style="padding:2px 8px" (click)="loadSuperDetail(s, coalesce(s.Port, s.port))">{{ t('security.superservers.act.detail') }}</button>
                    @if (canSecure) {
                      <button class="ghost" style="padding:2px 8px" (click)="openSuperEdit(s)">{{ t('security.superservers.act.edit') }}</button>
                      @if (superConfirm === coalesce(s.Port, s.port)) {
                        <button class="ghost danger" style="padding:2px 8px" (click)="removeSuper(coalesce(s.Port, s.port))">{{ t('common.deleteNow') }}</button>
                      } @else {
                        <button class="ghost danger" style="padding:2px 8px" (click)="superConfirm = coalesce(s.Port, s.port)">{{ t('common.delete') }}</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (!superservers.length) { <p class="empty">{{ t('common.none') }}</p> }
          @if (superDetail) {
            <h3 style="margin-top:16px">{{ t('security.superservers.detail') }}: {{ superDetailPort }}</h3>
            <table>
              <tbody>
                @for (e of entries(superDetail); track e[0]) {
                  <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                }
              </tbody>
            </table>
          }
          @if (canSecure) {
            <h3 style="margin-top:16px">{{ t('security.superservers.editForm') }}</h3>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.superservers.col.port') }}</label>
                <input [(ngModel)]="superForm.port" />
                <label class="label">{{ t('security.superservers.ph.bindAddress') }}</label>
                <input [(ngModel)]="superForm.BindAddress" />
                <button style="margin-top:8px" (click)="saveSuper()">{{ t('security.superservers.save') }}</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Privileged Routines -->
      @if (tab === 'Privileged Routines') {
        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('security.pr.list') }}</h2>
              <span class="spacer"></span>
              <button (click)="loadProutines()">{{ t('common.refresh') }}</button>
            </div>
            @if (proutines.length) {
              <table>
                <thead><tr><th>{{ t('security.pr.col.name') }}</th><th>{{ t('security.pr.col.description') }}</th><th></th></tr></thead>
                <tbody>
                  @for (p of proutines; track coalesce(p.Name, p.name, $index)) {
                    <tr>
                      <td class="mono">{{ coalesce(p.Name, p.name) }}</td>
                      <td>{{ coalesce(p.Description, p.description) }}</td>
                      <td>
                        <button class="ghost" style="padding:2px 8px" (click)="loadPrDetail(coalesce(p.Name, p.name))">{{ t('security.oauth2.act.detail') }}</button>
                        @if (canSecure) {
                          <button class="ghost" style="padding:2px 8px" (click)="openPrEdit(coalesce(p.Name, p.name))">{{ t('security.oauth2.act.edit') }}</button>
                          @if (prConfirm === coalesce(p.Name, p.name)) {
                            <button class="ghost danger" style="padding:2px 8px" (click)="removePr(coalesce(p.Name, p.name))">{{ t('common.deleteNow') }}</button>
                          } @else {
                            <button class="ghost danger" style="padding:2px 8px" (click)="prConfirm = coalesce(p.Name, p.name)">{{ t('common.delete') }}</button>
                          }
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else { <p class="empty">{{ t('security.pr.empty') }}</p> }
          </div>
          <div class="card">
            <h2>{{ t('security.pr.detail') }}</h2>
            @if (!prDetail) {
              <p class="empty">{{ t('security.pr.select') }}</p>
            } @else {
              <p class="muted mono">{{ prDetailName }}</p>
              <table>
                <tbody>
                  @for (e of entries(prDetail); track e[0]) {
                    <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                  }
                </tbody>
              </table>
            }
            @if (canSecure) {
              <h3 style="margin-top:16px">{{ t('security.pr.form') }}</h3>
              <div>
                <label class="label">{{ t('security.pr.ph.name') }}</label>
                <input [(ngModel)]="prForm.name" />
                <label class="label">{{ t('security.pr.ph.description') }}</label>
                <input [(ngModel)]="prForm.description" />
                <button style="margin-top:8px" (click)="savePr()">{{ t('security.pr.save') }}</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Resources & Services -->
      @if (tab === 'Resources & Services') {
        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('security.res.list') }}</h2>
              <span class="spacer"></span>
              <button (click)="loadResSvc()">{{ t('common.refresh') }}</button>
            </div>
            @if (resources.length) {
              <table>
                <thead><tr><th>{{ t('security.res.col.name') }}</th><th>{{ t('security.res.col.type') }}</th><th></th></tr></thead>
                <tbody>
                  @for (r of resources; track coalesce(r.Name, r.name, $index)) {
                    <tr>
                      <td class="mono">{{ coalesce(r.Name, r.name) }}</td>
                      <td>{{ coalesce(r.Type, r.type) }}</td>
                      <td>
                        <button class="ghost" style="padding:2px 8px" (click)="loadResourceDetail(coalesce(r.Name, r.name))">{{ t('security.oauth2.act.detail') }}</button>
                        @if (canSecure) { <button class="ghost" style="padding:2px 8px" (click)="openResourceEdit(coalesce(r.Name, r.name))">{{ t('security.oauth2.act.edit') }}</button> }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else { <p class="empty">{{ t('security.res.empty') }}</p> }
            <h3 style="margin-top:16px">{{ t('security.svc.list') }}</h3>
            @if (services.length) {
              <table>
                <thead><tr><th>{{ t('security.svc.col.name') }}</th><th>{{ t('security.svc.col.enabled') }}</th><th></th></tr></thead>
                <tbody>
                  @for (s of services; track coalesce(s.Name, s.name, $index)) {
                    <tr>
                      <td class="mono">{{ coalesce(s.Name, s.name) }}</td>
                      <td><span class="badge" [class.ok]="truthy(s.Enabled, s.enabled)">{{ truthy(s.Enabled, s.enabled) ? t('common.on') : t('common.off') }}</span></td>
                      <td>
                        <button class="ghost" style="padding:2px 8px" (click)="loadServiceDetail(coalesce(s.Name, s.name))">{{ t('security.oauth2.act.detail') }}</button>
                        @if (canSecure) { <button class="ghost" style="padding:2px 8px" (click)="openServiceEdit(coalesce(s.Name, s.name))">{{ t('security.oauth2.act.edit') }}</button> }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else { <p class="empty">{{ t('security.svc.empty') }}</p> }
          </div>
          <div class="card">
            <h2>{{ t('security.res.detail') }}</h2>
            @if (!resourceDetail) {
              <p class="empty">{{ t('security.res.select') }}</p>
            } @else {
              <p class="muted mono">{{ resourceDetailName }}</p>
              <table>
                <tbody>
                  <tr><th>{{ t('security.res.description') }}</th><td>{{ coalesce(resourceDetail.Description, resourceDetail.description) }}</td></tr>
                  <tr><th>{{ t('security.res.publicPermission') }}</th><td>{{ coalesce(resourceDetail.PublicPermission, resourceDetail.publicPermission) }}</td></tr>
                </tbody>
              </table>
              @if (canSecure) {
                <h3 style="margin-top:14px">{{ t('security.res.form') }}</h3>
                <label class="label">{{ t('security.res.ph.description') }}</label>
                <input [(ngModel)]="resourceForm.Description" />
                <button style="margin-top:8px" (click)="saveResource()">{{ t('security.res.save') }}</button>
              }
            }
            <h3 style="margin-top:16px">{{ t('security.svc.detail') }}</h3>
            @if (!serviceDetail) {
              <p class="empty">{{ t('security.svc.select') }}</p>
            } @else {
              <p class="muted mono">{{ serviceDetailName }}</p>
              <table>
                <tbody>
                  <tr><th>{{ t('security.svc.enabled') }}</th><td>{{ coalesce(serviceDetail.Enabled, serviceDetail.enabled) }}</td></tr>
                  <tr><th>{{ t('security.svc.autheEnabled') }}</th><td>{{ coalesce(serviceDetail.AutheEnabled, serviceDetail.autheEnabled) }}</td></tr>
                  <tr><th>{{ t('security.svc.clientSystems') }}</th><td class="mono">{{ coalesce(serviceDetail.ClientSystems, serviceDetail.clientSystems) }}</td></tr>
                  <tr><th>{{ t('security.svc.description') }}</th><td>{{ coalesce(serviceDetail.Description, serviceDetail.description) }}</td></tr>
                </tbody>
              </table>
              @if (canSecure) {
                <h3 style="margin-top:14px">{{ t('security.svc.form') }}</h3>
                <label class="label">{{ t('security.svc.ph.enabled') }}</label>
                <input [(ngModel)]="serviceForm.Enabled" />
                <label class="label">{{ t('security.svc.ph.autheEnabled') }}</label>
                <input [(ngModel)]="serviceForm.AutheEnabled" />
                <label class="label">{{ t('security.svc.ph.clientSystems') }}</label>
                <input [(ngModel)]="serviceForm.ClientSystems" />
                <label class="label">{{ t('security.svc.ph.description') }}</label>
                <input [(ngModel)]="serviceForm.Description" />
                <button style="margin-top:8px" (click)="saveService()">{{ t('security.svc.save') }}</button>
              }
            }
          </div>
        </div>
      }

      <!-- SQL Privileges -->
      @if (tab === 'SQL Privileges') {
        <div class="card">
          <div class="toolbar" style="margin-bottom:12px">
            <input [placeholder]="t('security.sql.ph.namespace')" [(ngModel)]="sqlNamespace" />
            <input [placeholder]="t('security.sql.ph.grantee')" [(ngModel)]="sqlGrantee" />
            <button (click)="querySql()">{{ t('security.sql.query') }}</button>
          </div>
          <h3>{{ t('security.sql.admin') }}</h3>
          @if (sqlAdmin.length) {
            <table>
              <tbody>
                @for (a of sqlAdmin; track $index) {
                  <tr><td class="mono">{{ sqlAdminItemText(a) }}</td></tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('security.sql.adminEmpty') }}</p> }
          <h3 style="margin-top:16px">{{ t('security.sql.column') }}</h3>
          @if (sqlColumn.length) {
            <table>
              <thead><tr><th>{{ t('security.sql.columnCol.table') }}</th><th>{{ t('security.sql.columnCol.column') }}</th><th>{{ t('security.sql.columnCol.priv') }}</th><th>{{ t('security.sql.col.grantedBy') }}</th></tr></thead>
              <tbody>
                @for (c of sqlColumn; track $index) {
                  <tr>
                    <td class="mono">{{ coalesce(c.Table, c.table) }}</td>
                    <td class="mono">{{ coalesce(c.Column, c.column) }}</td>
                    <td>{{ coalesce(c.Privilege, c.privilege) }}</td>
                    <td>{{ coalesce(c.GrantedBy, c.grantedBy) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('security.sql.columnEmpty') }}</p> }
          <h3 style="margin-top:16px">{{ t('security.sql.all') }}</h3>
          @if (sqlAll.length) {
            <table>
              <thead><tr><th>{{ t('security.sql.col.type') }}</th><th>{{ t('security.sql.col.object') }}</th><th>{{ t('security.sql.col.action') }}</th><th>{{ t('security.sql.col.grantedBy') }}</th><th>{{ t('security.sql.col.grantOption') }}</th><th>{{ t('security.sql.col.grantedVia') }}</th><th>{{ t('security.sql.col.hasColumnPriv') }}</th></tr></thead>
              <tbody>
                @for (p of sqlAll; track $index) {
                  <tr>
                    <td>{{ coalesce(p.Type, p.type) }}</td>
                    <td class="mono">{{ coalesce(p.Object, p.object) }}</td>
                    <td>{{ coalesce(p.Action, p.action) }}</td>
                    <td>{{ coalesce(p.GrantedBy, p.grantedBy) }}</td>
                    <td>{{ coalesce(p.GrantOption, p.grantOption) }}</td>
                    <td>{{ coalesce(p.GrantedVia, p.grantedVia) }}</td>
                    <td>{{ coalesce(p.HasColumnPriv, p.hasColumnPriv) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="empty">{{ t('security.sql.allEmpty') }}</p> }
          @if (canSecure) {
            <h3 style="margin-top:16px">{{ t('security.sql.grantRevoke') }}</h3>
            <p class="muted small">{{ t('security.sql.grantRevokeNote') }}</p>
            <div class="grid cols-2">
              <div>
                <label class="label">{{ t('security.sql.kind') }}</label>
                <select [(ngModel)]="sqlForm.kind">
                  <option value="admin">{{ t('security.sql.kind.admin') }}</option>
                  <option value="column">{{ t('security.sql.kind.column') }}</option>
                </select>
                <label class="label">{{ t('security.sql.ph.namespace') }}</label>
                <input [(ngModel)]="sqlForm.namespace" />
                <label class="label">{{ t('security.sql.ph.grantee') }}</label>
                <input [(ngModel)]="sqlForm.grantee" />
                <label class="label">{{ t('security.sql.ph.privilege') }}</label>
                <input [(ngModel)]="sqlForm.privilege" />
              </div>
              <div>
                <label class="label">{{ t('security.sql.ph.table') }}</label>
                <input [(ngModel)]="sqlForm.table" />
                <label class="label">{{ t('security.sql.ph.column') }}</label>
                <input [(ngModel)]="sqlForm.column" />
                <label class="label">{{ t('security.sql.ph.action') }}</label>
                <input [(ngModel)]="sqlForm.action" />
                <div class="toolbar" style="margin-top:8px">
                  <button (click)="sqlGrant()">{{ t('security.sql.grant') }}</button>
                  <button class="ghost danger" (click)="sqlRevoke()">{{ t('security.sql.revoke') }}</button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Audit Events -->
      @if (tab === 'Audit Events') {
        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('security.audit.list') }}</h2>
              <span class="spacer"></span>
              <button (click)="loadAuditEvents()">{{ t('common.refresh') }}</button>
            </div>
            @if (auditEvents.length) {
              <table>
                <thead><tr><th>{{ t('security.audit.col.eventName') }}</th><th>{{ t('security.audit.col.enabled') }}</th><th>{{ t('security.audit.col.total') }}</th><th>{{ t('security.audit.col.written') }}</th><th>{{ t('security.audit.col.lost') }}</th><th></th></tr></thead>
                <tbody>
                  @for (a of auditEvents; track coalesce(a.EventName, a.eventName, $index)) {
                    <tr>
                      <td class="mono">{{ coalesce(a.EventName, a.eventName) }}</td>
                      <td><span class="badge" [class.ok]="truthy(a.Enabled, a.enabled)">{{ truthy(a.Enabled, a.enabled) ? t('common.on') : t('common.off') }}</span></td>
                      <td>{{ coalesce(a.Total, a.total, 0) }}</td>
                      <td>{{ coalesce(a.Written, a.written, 0) }}</td>
                      <td>{{ coalesce(a.Lost, a.lost, 0) }}</td>
                      <td>
                        @if (canSecure) {
                          <button class="ghost" style="padding:2px 8px" (click)="openAuditEdit(a)">{{ t('security.oauth2.act.edit') }}</button>
                          <button class="ghost" style="padding:2px 8px" (click)="clearAuditCount(a)">{{ t('security.audit.clearCount') }}</button>
                          @if (auditConfirm === coalesce(a.EventName, a.eventName)) {
                            <button class="ghost danger" style="padding:2px 8px" (click)="removeAudit(a)">{{ t('common.deleteNow') }}</button>
                          } @else {
                            <button class="ghost danger" style="padding:2px 8px" (click)="auditConfirm = coalesce(a.EventName, a.eventName)">{{ t('common.delete') }}</button>
                          }
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else { <p class="empty">{{ t('security.audit.empty') }}</p> }
          </div>
          <div class="card">
            @if (canSecure) {
              <h2>{{ t('security.audit.edit') }}</h2>
              <label class="label">{{ t('security.audit.ph.eventName') }}</label>
              <input [(ngModel)]="auditForm.source" />
              <label class="label">{{ t('security.audit.ph.enabled') }}</label>
              <select [(ngModel)]="auditForm.enabled">
                <option [value]="true">{{ t('common.on') }}</option>
                <option [value]="false">{{ t('common.off') }}</option>
              </select>
              <button style="margin-top:8px" (click)="saveAudit()">{{ t('security.audit.save') }}</button>
            } @else { <p class="muted">{{ t('security.audit.empty') }}</p> }
          </div>
        </div>
      }

      <!-- Web Auth -->
      @if (tab === 'Web Auth') {
        <div class="grid cols-2">
          <div class="card">
            <div class="toolbar" style="margin-bottom:12px">
              <h2 style="margin:0">{{ t('security.webAuth.settings') }}</h2>
              <span class="spacer"></span>
              <button (click)="loadWebAuth()">{{ t('security.webAuth.load') }}</button>
              @if (canSecure) { <button (click)="saveWebAuth()">{{ t('security.webAuth.save') }}</button> }
            </div>
            @if (webAuth) {
              <table>
                <tbody>
                  @for (e of webAuthEntries; track e[0]) {
                    <tr><th>{{ e[0] }}</th><td>{{ e[1] }}</td></tr>
                  }
                </tbody>
              </table>
              <h3 style="margin-top:14px">{{ t('security.webAuth.editJson') }}</h3>
              <textarea rows="8" class="mono" [(ngModel)]="webAuthJson"></textarea>
            } @else { <p class="empty">{{ t('security.webAuth.empty') }}</p> }
          </div>
          <div class="card">
            <h2>{{ t('security.webAuth.smtp') }}</h2>
            @if (canSecure) {
              <div class="toolbar">
                <input [placeholder]="t('security.webAuth.ph.smtp')" [(ngModel)]="smtpPassword" />
                <button (click)="changeSmtpPassword()">{{ t('security.webAuth.smtpChange') }}</button>
              </div>
            } @else { <p class="muted">{{ t('common.none') }}</p> }
          </div>
        </div>
      }
    </div>
  `,
})
export class SecurityComponent implements OnInit {
  coalesce = coalesce;
  t = (k: string) => this.i18n.t(k);
  private readonly i18n = inject(I18nService);
  private readonly admin = inject(AdminService);
  private readonly perms = inject(PermissionService);

  tabs = ['Wallet', 'X509', 'OAuth2', 'SSL', 'Encryption', 'FS Access', 'MFT / LDAP', 'Superservers', 'Privileged Routines', 'Resources & Services', 'SQL Privileges', 'Audit Events', 'Web Auth'];
  tab = 'Wallet';
  // Live getters (see SystemComponent): re-evaluated each CD cycle.
  get canWallet(): boolean { return this.perms.can(PRIV.WALLET); }
  get canSecure(): boolean { return this.perms.can(PRIV.SECURE); }
  get canFsAccess(): boolean { return this.perms.can(PRIV.FS_ACCESS); }
  get canOauth2Client(): boolean { return this.perms.can(PRIV.OAUTH2_CLIENT); }
  get canOauth2Server(): boolean { return this.perms.can(PRIV.OAUTH2_SERVER); }
  get canOauth2Registration(): boolean { return this.perms.can(PRIV.OAUTH2_REGISTRATION); }
  error = '';

  collections: any[] = [];
  secrets: any[] = [];
  secretCollection = '';
  walletName = '';
  walletDetail: any = null;
  walletDetailName = '';
  secretForm = { name: '', value: '', type: '' };

  x509: any[] = [];
  x509Detail: any = null;
  x509Cert: any = null;
  x509CertJson = '';
  x509DetailAlias = '';
  x509Form = { alias: '', certificateFile: '', description: '' };
  x509Confirm: string | null = null;

  oauthDefs: any[] = [];
  oauthClients: any[] = [];
  oauthResources: any[] = [];
  oauthDefDetail: any = null;
  oauthDefDetailId = '';
  oauthDefForm = { IssuerEndpoint: '', Description: '', SSLConfiguration: '' };
  oauthDefConfirm: string | null = null;
  oauthClientDetail: any = null;
  oauthClientDetailId = '';
  oauthClientJson = '';
  oauthClientConfirm: string | null = null;
  oauthNewClient = { ClientType: 'public', Name: '' };
  oauthResourceDetail: any = null;
  oauthResourceDetailName = '';
  oauthResourceJson = '';
  oauthResourceConfirm: string | null = null;
  oauthClientConfigDetail: any = null;
  oauthClientConfigName = '';
  oauthClientConfigJson = '';
  oauthClientConfigConfirm: string | null = null;
  oauthMappingDetail: any = null;
  oauthMappingKey = '';
  oauthMappingJson = '';
  oauthMappingConfirm: string | null = null;
  oauthAsConfigured = false;
  oauthAsForm = { IssuerEndpoint: '', Description: '', AccessTokenInterval: '', SupportedScopes: '', SSLConfiguration: '', SigningAlgorithm: '' };
  oauthAsConfirm = false;
  oauthAsPassword = '';

  ssl: any[] = [];
  sslFormOpen = false;
  sslForm = { name: '', type: 0, verifyPeer: 0, enabled: true };

  encryption: any = null;
  encKeys: any[] = [];
  dataElementKeys: any[] = [];
  keyFile = '';
  encSettingsForm = { DBEncStartMode: '', DBEncJournal: '', DBEncIRISSecurity: '', DBEncIRISTemp: '', AuditEncrypt: '', DBEncStartKMIPServer: '', DBEncStartKeyFile: '' };
  encNewKey = { File: '', AdminName: '', AdminPassword: '', KeyLen: '', Description: '' };
  encActivate = { Action: 'activate', AdminName: '', AdminPassword: '' };
  encFileAdmin = { file: '', AdminName: '', AdminPassword: '' };
  encFileKey = { file: '' };
  encAdminConfirm = false;
  encKeyConfirm = false;

  oauthClientConfigs: any[] = [];
  oauthMappings: any[] = [];
  selectedServerId = '';
  selectedService = '';

  fsPurposes: any[] = [];
  fsPurposeDetail: any = null;
  fsSelectedPurpose = '';

  mft: any[] = [];
  ldap: any[] = [];
  mftDetail: any = null;
  mftDetailName = '';
  mftForm = { connection: '', Service: 'Box', URL: '', SSLConfiguration: '', Username: '', ApplicationName: '' };
  mftAuth = { connection: '', scope: '', redirect: '' };
  mftAuthResult = '';
  mftConfirm: string | null = null;
  ldapDetail: any = null;
  ldapDetailName = '';
  ldapForm = { name: '', Description: '', Host: '', LDAPBaseDN: '' };
  ldapSearchPassword = { name: '', Password: '' };
  ldapSearchResult = '';
  ldapTest = { Username: '', Password: '' };
  ldapTestResult = '';
  ldapConfirm: string | null = null;

  superservers: any[] = [];
  superDetail: any = null;
  superDetailPort: number | string = '';
  superForm = { port: 0, BindAddress: '' };
  superConfirm: string | number | null = null;

  proutines: any[] = [];
  prDetail: any = null;
  prDetailName = '';
  prForm = { name: '', description: '' };
  prConfirm: string | null = null;

  resources: any[] = [];
  services: any[] = [];
  resourceDetail: any = null;
  resourceDetailName = '';
  resourceForm = { name: '', Description: '' };
  serviceDetail: any = null;
  serviceDetailName = '';
  serviceForm = { name: '', Enabled: '', AutheEnabled: '', ClientSystems: '', Description: '' };

  sqlNamespace = '';
  sqlGrantee = '';
  sqlAdmin: any[] = [];
  sqlColumn: any[] = [];
  sqlAll: any[] = [];
  sqlForm = { kind: 'admin', namespace: '', grantee: '', privilege: '', table: '', column: '', action: 'grant' };

  auditEvents: any[] = [];
  auditForm = { source: '', enabled: true };
  auditConfirm: string | null = null;

  webAuth: any = null;
  webAuthJson = '';
  webAuthEntries: [string, unknown][] = [];
  smtpPassword = '';

  ngOnInit(): void {
    this.loadWallet();
  }

  truthy(a: unknown, b: unknown): boolean {
    const v = a !== undefined && a !== null ? a : b;
    return v === true || v === 'true' || v === 'True';
  }

  /** Normalize a tab name to its i18n key suffix (lowercase, alnum only). */
  tabKey(tb: string): string {
    return tb.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /** First element of an array (or the value itself), as a string — template-safe. */
  first(v: unknown): string {
    if (Array.isArray(v)) return v.length ? String(v[0] ?? '') : '';
    return v === null || v === undefined ? '' : String(v);
  }

  /** Object entries for generic detail tables (template-safe). */
  entries(o: unknown): [string, unknown][] {
    if (!o || typeof o !== 'object') return [];
    return Object.entries(o as Record<string, unknown>);
  }

  /** Defensive string rendering for arbitrary API values. */
  asText(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') {
      try { return JSON.stringify(v); } catch { return ''; }
    }
    return String(v);
  }

  /** Join an array (or scalar) of strings into a comma-separated field. */
  joinArr(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) return v.map((x) => this.asText(x)).filter(Boolean).join(', ');
    return this.asText(v);
  }

  /** Split a comma-separated field into a trimmed, non-empty string array. */
  splitArr(v: string): string[] {
    return (v || '').split(',').map((s) => s.trim()).filter(Boolean);
  }

  /** One-line rendering of an admin-privilege list item (object or string). */
  sqlAdminItemText(v: unknown): string {
    if (typeof v === 'string') return v;
    if (!v || typeof v !== 'object') return this.asText(v);
    const o = v as Record<string, unknown>;
    const parts = [
      this.asText(coalesce(o.Privilege, o.privilege, o.Name, o.name)),
      this.asText(o.GrantedBy),
      this.asText(o.GrantOption),
    ];
    return parts.filter((p) => p !== '').join(' | ');
  }

  switchTab(t: string): void {
    this.tab = t;
    this.error = '';
    if (t === 'Wallet') this.loadWallet();
    else if (t === 'X509') this.loadX509();
    else if (t === 'OAuth2') this.loadOauth();
    else if (t === 'SSL') this.loadSsl();
    else if (t === 'Encryption') this.loadEncryption();
    else if (t === 'FS Access') this.loadFsAccess();
    else if (t === 'MFT / LDAP') this.loadMftLdap();
    else if (t === 'Superservers') this.loadSuperservers();
    else if (t === 'Privileged Routines') this.loadProutines();
    else if (t === 'Resources & Services') this.loadResSvc();
    else if (t === 'Audit Events') this.loadAuditEvents();
    else if (t === 'Web Auth') this.loadWebAuth();
  }

  async loadWallet(): Promise<void> {
    try { const l = await this.admin.client.domains.security.listWalletCollections(); this.collections = Array.isArray(l) ? l : []; }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadSecrets(name: string): Promise<void> {
    this.secretCollection = name;
    try { const l = await this.admin.client.domains.security.listWalletSecrets(name); this.secrets = Array.isArray(l) ? l : []; }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async createWallet(): Promise<void> {
    if (!this.walletName) return;
    try {
      // Collection create requires `EditResource` / `UseResource` in
      // "resource:permission" format (the `?name` query carries the collection id).
      await this.admin.client.domains.security.createWalletCollection(this.walletName, { EditResource: '%Admin_Manage:USE', UseResource: '%Admin_Manage:READ' });
      await this.loadWallet();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeWallet(name: string): Promise<void> {
    try { await this.admin.client.domains.security.removeWalletCollection(name); await this.loadWallet(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeSecret(name: string): Promise<void> {
    try { await this.admin.client.domains.security.removeWalletSecret(name); await this.loadSecrets(this.secretCollection); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadWalletDetail(name: string): Promise<void> {
    this.walletDetail = null;
    this.walletDetailName = name;
    try { this.walletDetail = await this.admin.client.domains.security.getWalletCollection(name); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async saveSecret(): Promise<void> {
    const f = this.secretForm;
    if (!f.name || !f.type) return;
    const collection = this.secretCollection || this.walletName;
    if (!collection) return;
    try {
      // Secret id is the dotted `Collection.Secret`; body is `{ Type,
      // WalletSecretConfig }`. For %Wallet.KeyValue the config is
      // `Secret: { <key>: <value> }`.
      const body: Record<string, unknown> = { Type: f.type };
      body.WalletSecretConfig = { Secret: { value: f.value } };
      await this.admin.client.domains.security.createWalletSecret(collection + '.' + f.name, body);
      await this.loadWallet();
      await this.loadSecrets(collection);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  async loadX509(): Promise<void> {
    try { const l = await this.admin.client.domains.security.listX509Credentials(); this.x509 = Array.isArray(l) ? l : []; }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadX509Detail(alias: string): Promise<void> {
    this.x509Detail = null;
    this.x509Cert = null;
    this.x509CertJson = '';
    this.x509DetailAlias = alias;
    try { this.x509Detail = await this.admin.client.domains.security.getX509Credential(alias); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadX509Cert(alias: string): Promise<void> {
    this.x509Detail = null;
    this.x509DetailAlias = alias;
    try {
      this.x509Cert = await this.admin.client.domains.security.getX509Certificate(alias);
      this.x509CertJson = JSON.stringify(this.x509Cert, null, 2);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async createX509(): Promise<void> {
    const f = this.x509Form;
    if (!f.alias) return;
    try { await this.admin.client.domains.security.createX509Credential(f.alias, { Alias: f.alias, CertificateFile: f.certificateFile } as any); await this.loadX509(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openX509Edit(alias: string): void {
    this.x509Form.alias = alias;
    this.x509Form.description = '';
    const d = this.x509Detail;
    if (d && this.asText(coalesce(d.Alias, d.alias)) === alias) {
      this.x509Form.description = this.asText(coalesce(d.Description, d.description));
    }
  }
  async saveX509(): Promise<void> {
    const f = this.x509Form;
    if (!f.alias) return;
    try { await this.admin.client.domains.security.updateX509Credential(f.alias, { alias: f.alias, Description: f.description } as any); await this.loadX509(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeX509(alias: string): Promise<void> {
    this.x509Confirm = null;
    try { await this.admin.client.domains.security.removeX509Credential(alias); await this.loadX509(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  async loadOauth(): Promise<void> {
    try {
      const [defs, clients, resources] = await Promise.all([
        this.admin.client.domains.security.listOAuth2ServerDefinitions().catch(() => []),
        this.admin.client.domains.security.listOAuth2Clients().then((l: any) => (Array.isArray(l) ? l : [])).catch(() => []),
        this.admin.client.domains.security.listOAuth2ResourceServers().then((l: any) => (Array.isArray(l) ? l : [])).catch(() => []),
      ]);
      this.oauthDefs = defs as any[];
      this.oauthClients = clients as any[];
      this.oauthResources = resources as any[];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // OAuth2 — server definitions
  async loadOAuthDefDetail(id: string): Promise<void> {
    this.oauthDefDetail = null;
    this.oauthDefDetailId = id;
    try { this.oauthDefDetail = await this.admin.client.domains.security.getOAuth2ServerDefinition(id); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openOAuthDefEdit(id: string): void {
    const d = this.oauthDefDetail;
    this.oauthDefForm.IssuerEndpoint = d ? this.asText(d.IssuerEndpoint) : '';
    this.oauthDefForm.Description = d ? this.asText(d.Description) : '';
    this.oauthDefForm.SSLConfiguration = d ? this.asText(d.SSLConfiguration) : '';
  }
  async saveOAuthDef(): Promise<void> {
    const f = this.oauthDefForm;
    if (!this.oauthDefDetailId) return;
    try {
      await this.admin.client.domains.security.updateOAuth2ServerDefinition(this.oauthDefDetailId, {
        serverId: this.oauthDefDetailId,
        IssuerEndpoint: f.IssuerEndpoint,
        Description: f.Description,
        SSLConfiguration: f.SSLConfiguration,
      });
      await this.loadOauth();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeOAuthDef(id: string): Promise<void> {
    this.oauthDefConfirm = null;
    try { await this.admin.client.domains.security.removeOAuth2ServerDefinition(id); await this.loadOauth(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async initialOAuth2Token(id: string): Promise<void> {
    try { await this.admin.client.domains.security.initialOAuth2AccessToken(id); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // OAuth2 — AS clients
  oauthClientId(c: any): string {
    return this.asText(coalesce(c.ClientId, c.clientId, c.Name, c.name));
  }
  async loadOAuthClientDetail(id: string): Promise<void> {
    this.oauthClientDetail = null;
    this.oauthClientJson = '';
    this.oauthClientDetailId = id;
    try {
      this.oauthClientDetail = await this.admin.client.domains.security.getOAuth2Client(id);
      this.oauthClientJson = JSON.stringify(this.oauthClientDetail, null, 2);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openOAuthClientEdit(id: string): void {
    this.loadOAuthClientDetail(id);
  }
  async saveOAuthClient(): Promise<void> {
    if (!this.oauthClientDetailId || !this.oauthClientJson) return;
    try {
      const body = JSON.parse(this.oauthClientJson) as Record<string, unknown>;
      body.clientId = this.oauthClientDetailId;
      await this.admin.client.domains.security.updateOAuth2Client(this.oauthClientDetailId, body);
      await this.loadOauth();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeOAuthClient(id: string): Promise<void> {
    this.oauthClientConfirm = null;
    try { await this.admin.client.domains.security.removeOAuth2Client(id); await this.loadOauth(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async rotateOAuthClientSecret(id: string): Promise<void> {
    try { await this.admin.client.domains.security.changeOAuth2ClientSecret(id, { secret: '' }); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async createOAuth2Client(): Promise<void> {
    const f = this.oauthNewClient;
    if (!f.Name) return;
    try { await this.admin.client.domains.security.createOAuth2Client({ ClientType: f.ClientType, Name: f.Name } as any); await this.loadOauth(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // OAuth2 — resource servers
  async loadOAuthResourceDetail(name: string): Promise<void> {
    this.oauthResourceDetail = null;
    this.oauthResourceJson = '';
    this.oauthResourceDetailName = name;
    try {
      this.oauthResourceDetail = await this.admin.client.domains.security.getOAuth2ResourceServer(name);
      this.oauthResourceJson = JSON.stringify(this.oauthResourceDetail, null, 2);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openOAuthResourceEdit(name: string): void {
    this.loadOAuthResourceDetail(name);
  }
  async saveOAuthResource(): Promise<void> {
    if (!this.oauthResourceDetailName || !this.oauthResourceJson) return;
    try {
      const body = JSON.parse(this.oauthResourceJson) as Record<string, unknown>;
      body.name = this.oauthResourceDetailName;
      await this.admin.client.domains.security.updateOAuth2ResourceServer(this.oauthResourceDetailName, body);
      await this.loadOauth();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeOAuthResource(name: string): Promise<void> {
    this.oauthResourceConfirm = null;
    try { await this.admin.client.domains.security.removeOAuth2ResourceServer(name); await this.loadOauth(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async rotateOAuthResourceSecret(name: string): Promise<void> {
    try { await this.admin.client.domains.security.postOAuth2ResourceServerSecret(name); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // OAuth2 — client configuration (by applicationName)
  async loadOAuthClientConfig(): Promise<void> {
    const n = this.oauthClientConfigName;
    this.oauthClientConfigDetail = null;
    this.oauthClientConfigJson = '';
    if (!n) return;
    try {
      this.oauthClientConfigDetail = await this.admin.client.domains.security.getOAuth2ClientConfiguration(n);
      this.oauthClientConfigJson = JSON.stringify(this.oauthClientConfigDetail, null, 2);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async saveOAuthClientConfig(): Promise<void> {
    const n = this.oauthClientConfigName;
    if (!n || !this.oauthClientConfigJson) return;
    try {
      const body = JSON.parse(this.oauthClientConfigJson) as Record<string, unknown>;
      body.applicationName = n;
      await this.admin.client.domains.security.updateOAuth2ClientConfiguration(n, body);
      await this.loadOAuthClientConfig();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeOAuthClientConfig(): Promise<void> {
    this.oauthClientConfigConfirm = null;
    const n = this.oauthClientConfigName;
    if (!n) return;
    try {
      await this.admin.client.domains.security.removeOAuth2ClientConfiguration(n);
      this.oauthClientConfigDetail = null;
      this.oauthClientConfigJson = '';
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async registerOAuth2Client(): Promise<void> {
    const n = this.oauthClientConfigName;
    if (!n) return;
    try { await this.admin.client.domains.security.registerOAuth2Client(n); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async rotateOAuth2Keys(): Promise<void> {
    const n = this.oauthClientConfigName;
    if (!n) return;
    try { await this.admin.client.domains.security.rotateOAuth2ClientKeys(n); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async createOAuth2Secrets(): Promise<void> {
    const n = this.oauthClientConfigName;
    if (!n) return;
    try { await this.admin.client.domains.security.createOAuth2ClientSecrets(n, { applicationName: n }); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // OAuth2 — resource server mapping (by key)
  async loadOAuthMapping(): Promise<void> {
    const k = this.oauthMappingKey;
    this.oauthMappingDetail = null;
    this.oauthMappingJson = '';
    if (!k) return;
    try {
      this.oauthMappingDetail = await this.admin.client.domains.security.getOAuth2ResourceServerMapping(k);
      this.oauthMappingJson = JSON.stringify(this.oauthMappingDetail, null, 2);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async saveOAuthMapping(): Promise<void> {
    const k = this.oauthMappingKey;
    if (!k || !this.oauthMappingJson) return;
    try {
      const body = JSON.parse(this.oauthMappingJson) as Record<string, unknown>;
      body.key = k;
      await this.admin.client.domains.security.updateOAuth2ResourceServerMapping(k, body);
      await this.loadOAuthMapping();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeOAuthMapping(): Promise<void> {
    this.oauthMappingConfirm = null;
    const k = this.oauthMappingKey;
    if (!k) return;
    try {
      await this.admin.client.domains.security.removeOAuth2ResourceServerMapping(k);
      this.oauthMappingDetail = null;
      this.oauthMappingJson = '';
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // OAuth2 — instance AS configuration
  async loadOAuthAs(): Promise<void> {
    try {
      const d = await this.admin.client.domains.security.getOAuth2ServerConfig();
      this.oauthAsConfigured = true;
      this.oauthAsForm = {
        IssuerEndpoint: this.asText(d?.IssuerEndpoint),
        Description: this.asText(d?.Description),
        AccessTokenInterval: this.asText(d?.AccessTokenInterval),
        SupportedScopes: this.asText(d?.SupportedScopes),
        SSLConfiguration: this.asText(d?.SSLConfiguration),
        SigningAlgorithm: this.asText(d?.SigningAlgorithm),
      };
    } catch {
      // 404 = this instance is not acting as an AS — not an error.
      this.oauthAsConfigured = false;
    }
  }
  async saveOAuthAs(): Promise<void> {
    const f = this.oauthAsForm;
    try {
      await this.admin.client.domains.security.updateOAuth2ServerConfig({
        IssuerEndpoint: f.IssuerEndpoint,
        Description: f.Description,
        AccessTokenInterval: f.AccessTokenInterval,
        SupportedScopes: f.SupportedScopes,
        SSLConfiguration: f.SSLConfiguration,
        SigningAlgorithm: f.SigningAlgorithm,
      });
      this.oauthAsConfigured = true;
      await this.loadOAuthAs();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async stopOAuthAs(): Promise<void> {
    this.oauthAsConfirm = false;
    try {
      await this.admin.client.domains.security.removeOAuth2ServerConfig();
      this.oauthAsConfigured = false;
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async changeOAuthAsPassword(): Promise<void> {
    if (!this.oauthAsPassword) return;
    try {
      await this.admin.client.domains.security.changeOAuth2ServerPassword({ ServerPassword: this.oauthAsPassword });
      this.oauthAsPassword = '';
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  async loadSsl(): Promise<void> {
    try { const l = await this.admin.client.domains.security.listSSLConfigurations(); this.ssl = Array.isArray(l) ? l : []; }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async createSsl(): Promise<void> {
    const name = this.sslForm.name.trim();
    if (!name) return;
    try {
      // Verified live: the v2 API requires Enabled / Type / VerifyPeer in the
      // body, `name` as the query param, and REJECTS `Name` in the body
      // (40307 UnexpectedRequestBodyField). Type is 0 = client, 1 = server.
      await this.admin.client.domains.security.createSSLConfiguration(name, {
        Enabled: this.sslForm.enabled,
        Type: this.sslForm.type,
        VerifyPeer: this.sslForm.verifyPeer,
      });
      this.sslFormOpen = false;
      this.sslForm = { name: '', type: 0, verifyPeer: 0, enabled: true };
      await this.loadSsl();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  /** True when the given value (either casing) is truthy. */
  truthySsl(a: unknown, b: unknown): boolean {
    const v = a !== undefined && a !== null ? a : b;
    return v === true || v === 'true' || v === 'True' || v === 1 || v === '1';
  }
  async testSsl(name: string): Promise<void> {
    try { await this.admin.client.domains.security.testSSLConfiguration(name); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeSsl(name: string): Promise<void> {
    try { await this.admin.client.domains.security.removeSSLConfiguration(name); await this.loadSsl(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  async loadEncryption(): Promise<void> {
    try {
      const s: any = await this.admin.client.domains.security.getEncryptionSettings();
      this.encryption = s;
      this.encSettingsForm = {
        DBEncStartMode: this.asText(s?.DBEncStartMode),
        DBEncJournal: this.asText(s?.DBEncJournal),
        DBEncIRISSecurity: this.asText(s?.DBEncIRISSecurity),
        DBEncIRISTemp: this.asText(s?.DBEncIRISTemp),
        AuditEncrypt: this.asText(s?.AuditEncrypt),
        DBEncStartKMIPServer: this.asText(s?.DBEncStartKMIPServer),
        DBEncStartKeyFile: this.asText(s?.DBEncStartKeyFile),
      };
      const [keys, deks] = await Promise.all([
        this.admin.client.domains.security.listEncryptionKeys().catch(() => []),
        this.admin.client.domains.security.listDataElementKeys().catch(() => []),
      ]);
      this.encKeys = Array.isArray(keys) ? keys : [];
      this.dataElementKeys = Array.isArray(deks) ? deks : [];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async saveEncryptionSettings(): Promise<void> {
    const f = this.encSettingsForm;
    try {
      await this.admin.client.domains.security.setEncryptionSettings({
        DBEncStartMode: f.DBEncStartMode,
        DBEncJournal: f.DBEncJournal,
        DBEncIRISSecurity: f.DBEncIRISSecurity,
        DBEncIRISTemp: f.DBEncIRISTemp,
        AuditEncrypt: f.AuditEncrypt,
        DBEncStartKMIPServer: f.DBEncStartKMIPServer,
        DBEncStartKeyFile: f.DBEncStartKeyFile,
      } as any);
      await this.loadEncryption();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async createEncryptionKey(): Promise<void> {
    const f = this.encNewKey;
    if (!f.File || !f.AdminName || !f.AdminPassword) return;
    try { await this.admin.client.domains.security.createEncryptionKey(f); await this.loadEncryption(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async activateEncryptionKey(): Promise<void> {
    const f = this.encActivate;
    if (!f.Action || !f.AdminName || !f.AdminPassword) return;
    try { await this.admin.client.domains.security.activateEncryptionKey(f); await this.loadEncryption(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async addEncryptionFileAdmin(): Promise<void> {
    const f = this.encFileAdmin;
    if (!f.file) return;
    try { await this.admin.client.domains.security.addEncryptionFileAdmin({ file: f.file, AdminName: f.AdminName, AdminPassword: f.AdminPassword }); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeEncryptionFileAdmin(): Promise<void> {
    this.encAdminConfirm = false;
    const f = this.encFileAdmin;
    if (!f.file) return;
    try { await this.admin.client.domains.security.removeEncryptionFileAdmin(f.file); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async addEncryptionFileKey(): Promise<void> {
    const f = this.encFileKey;
    if (!f.file) return;
    try { await this.admin.client.domains.security.addEncryptionFileKey({ file: f.file }); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeEncryptionFileKey(): Promise<void> {
    this.encKeyConfirm = false;
    const f = this.encFileKey;
    if (!f.file) return;
    try { await this.admin.client.domains.security.removeEncryptionFileKey(f.file); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  async loadClientConfigs(): Promise<void> {
    this.oauthClientConfigs = [];
    if (!this.selectedServerId) return;
    try {
      const l = await this.admin.client.domains.security.getOAuth2ClientConfigurations(this.selectedServerId);
      this.oauthClientConfigs = Array.isArray(l) ? l : [];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  async loadMappings(): Promise<void> {
    this.oauthMappings = [];
    if (!this.selectedService) return;
    try {
      const l = await this.admin.client.domains.security.getOAuth2ResourceServerMappings(this.selectedService);
      this.oauthMappings = Array.isArray(l) ? l : [];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  async loadFsAccess(): Promise<void> {
    try {
      const l = await this.admin.client.domains.security.listFsAccessPurposes();
      this.fsPurposes = Array.isArray(l) ? l : [];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  selectFsPurpose(purpose: string): void {
    this.fsSelectedPurpose = purpose;
    this.fsPurposeDetail = null;
    this.admin.client.domains.security.getFsAccessPurpose(purpose)
      .then((r) => { this.fsPurposeDetail = r; })
      .catch(() => { this.fsPurposeDetail = null; });
  }

  async loadMftLdap(): Promise<void> {
    try {
      const [m, l] = await Promise.all([
        this.admin.client.domains.security.listMFTConnections().then((x: any) => (Array.isArray(x) ? x : [])).catch(() => []),
        this.admin.client.domains.security.listLDAPConfigurations().then((x: any) => (Array.isArray(x) ? x : [])).catch(() => []),
      ]);
      this.mft = m as any[];
      this.ldap = l as any[];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadMftDetail(name: string): Promise<void> {
    this.mftDetail = null;
    this.mftDetailName = name;
    try { this.mftDetail = await this.admin.client.domains.security.getMFTConnection(name); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openMftEdit(name: string): void {
    const d = this.mftDetail;
    this.mftForm.connection = name;
    this.mftForm.Service = this.asText(coalesce(d?.Service, d?.service)) || 'Box';
    this.mftForm.URL = d ? this.asText(coalesce(d.URL, d.url)) : '';
    this.mftForm.SSLConfiguration = d ? this.asText(coalesce(d.SSLConfiguration, d.sslConfiguration)) : '';
    this.mftForm.Username = d ? this.asText(coalesce(d.Username, d.username)) : '';
    this.mftForm.ApplicationName = d ? this.asText(coalesce(d.ApplicationName, d.applicationName)) : '';
  }
  async saveMft(): Promise<void> {
    const f = this.mftForm;
    if (!f.connection) return;
    try {
      // `connection` is a query param (handled by the client); the body requires
      // Service / URL / SSLConfiguration / Username / ApplicationName (no Password).
      await this.admin.client.domains.security.updateMFTConnection(f.connection, {
        Service: f.Service,
        URL: f.URL,
        SSLConfiguration: f.SSLConfiguration,
        Username: f.Username,
        ApplicationName: f.ApplicationName,
      });
      await this.loadMftLdap();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeMft(name: string): Promise<void> {
    this.mftConfirm = null;
    try { await this.admin.client.domains.security.removeMFTConnection(name); await this.loadMftLdap(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async revokeMftToken(name: string): Promise<void> {
    try { await this.admin.client.domains.security.revokeMFTToken(name); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadMftAuthUrl(): Promise<void> {
    const a = this.mftAuth;
    if (!a.connection) return;
    this.mftAuthResult = '';
    try {
      const r = await this.admin.client.domains.security.getMFTAuthCodeUrl(a.connection, { scope: a.scope, redirect: a.redirect });
      this.mftAuthResult = this.asText(r);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadLdapDetail(name: string): Promise<void> {
    this.ldapDetail = null;
    this.ldapDetailName = name;
    try { this.ldapDetail = await this.admin.client.domains.security.getLDAPConfiguration(name); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openLdapEdit(name: string): void {
    const d = this.ldapDetail;
    this.ldapForm.name = name;
    this.ldapForm.Description = d ? this.asText(coalesce(d.Description, d.description)) : '';
    // LDAPHostNames is an array; join for single-field display.
    this.ldapForm.Host = d ? this.joinArr(coalesce(d.LDAPHostNames, d.Host, d.host)) : '';
    this.ldapForm.LDAPBaseDN = d ? this.asText(d.LDAPBaseDN) : '';
  }
  async saveLdap(): Promise<void> {
    const f = this.ldapForm;
    if (!f.name) return;
    try {
      // `name` is a query param (handled by the client); `LDAPHostNames` is an
      // array (the `Host` field is rejected by the API).
      await this.admin.client.domains.security.updateLDAPConfiguration(f.name, {
        Description: f.Description,
        LDAPHostNames: this.splitArr(f.Host),
        LDAPBaseDN: f.LDAPBaseDN,
      });
      await this.loadMftLdap();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeLdap(name: string): Promise<void> {
    this.ldapConfirm = null;
    try { await this.admin.client.domains.security.removeLDAPConfiguration(name); await this.loadMftLdap(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  prefillLdapSearch(name: string): void {
    this.ldapSearchPassword = { name, Password: '' };
    this.ldapSearchResult = '';
  }
  async searchLdapPassword(): Promise<void> {
    const f = this.ldapSearchPassword;
    if (!f.name || !f.Password) return;
    this.ldapSearchResult = '';
    try {
      const r = await this.admin.client.domains.security.searchLdapPassword(f.name, { name: f.name, Password: f.Password });
      this.ldapSearchResult = this.asText(r);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async testLdapLogin(): Promise<void> {
    const f = this.ldapTest;
    if (!f.Username || !f.Password) return;
    this.ldapTestResult = '';
    try {
      const r = await this.admin.client.domains.security.testLdapLogin({ Username: f.Username, Password: f.Password });
      this.ldapTestResult = this.asText(r);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  async loadSuperservers(): Promise<void> {
    try { const l = await this.admin.client.domains.security.listSuperservers(); this.superservers = Array.isArray(l) ? l : []; }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadSuperDetail(row: any, port: string | number): Promise<void> {
    this.superDetail = null;
    this.superDetailPort = port;
    const p = Number(port);
    const bind = this.asText(coalesce(row?.BindAddress, row?.bindAddress));
    try { this.superDetail = await this.admin.client.domains.security.getSuperserver(p, bind); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openSuperEdit(row: any): void {
    const p = Number(coalesce(row?.Port, row?.port));
    this.superForm.port = p || 0;
    this.superForm.BindAddress = this.asText(coalesce(row?.BindAddress, row?.bindAddress));
  }
  async saveSuper(): Promise<void> {
    const f = this.superForm;
    if (!f.port) return;
    try {
      await this.admin.client.domains.security.updateSuperserver(f.port, { port: f.port, BindAddress: f.BindAddress });
      await this.loadSuperservers();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeSuper(port: string | number): Promise<void> {
    this.superConfirm = null;
    try { await this.admin.client.domains.security.removeSuperserver(Number(port)); await this.loadSuperservers(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // Privileged routines
  async loadProutines(): Promise<void> {
    try {
      const l = await this.admin.client.domains.security.listPrivilegedRoutines();
      this.proutines = Array.isArray(l) ? l : [];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadPrDetail(name: string): Promise<void> {
    this.prDetail = null;
    this.prDetailName = name;
    try { this.prDetail = await this.admin.client.domains.security.getPrivilegedRoutine(name); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openPrEdit(name: string): void {
    const d = this.prDetail;
    this.prForm.name = name;
    this.prForm.description = d ? this.asText(coalesce(d.Description, d.description)) : '';
  }
  async savePr(): Promise<void> {
    const f = this.prForm;
    if (!f.name) return;
    try {
      await this.admin.client.domains.security.updatePrivilegedRoutine(f.name, { name: f.name, Description: f.description });
      await this.loadProutines();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removePr(name: string): Promise<void> {
    this.prConfirm = null;
    try { await this.admin.client.domains.security.removePrivilegedRoutine(name); await this.loadProutines(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // Resources & services
  async loadResSvc(): Promise<void> {
    try {
      const [r, s] = await Promise.all([
        this.admin.client.domains.permissions.listResources().then((x: any) => (Array.isArray(x) ? x : [])).catch(() => []),
        this.admin.client.domains.permissions.listServices().then((x: any) => (Array.isArray(x) ? x : [])).catch(() => []),
      ]);
      this.resources = r as any[];
      this.services = s as any[];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadResourceDetail(name: string): Promise<void> {
    this.resourceDetail = null;
    this.resourceDetailName = name;
    try { this.resourceDetail = await this.admin.client.domains.permissions.getResource(name); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openResourceEdit(name: string): void {
    const d = this.resourceDetail;
    this.resourceForm.name = name;
    this.resourceForm.Description = d ? this.asText(coalesce(d.Description, d.description)) : '';
  }
  async saveResource(): Promise<void> {
    const f = this.resourceForm;
    if (!f.name) return;
    try {
      await this.admin.client.domains.security.updateResource(f.name, { name: f.name, Description: f.Description });
      await this.loadResSvc();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async loadServiceDetail(name: string): Promise<void> {
    this.serviceDetail = null;
    this.serviceDetailName = name;
    try { this.serviceDetail = await this.admin.client.domains.permissions.getService(name); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  openServiceEdit(name: string): void {
    const d = this.serviceDetail;
    this.serviceForm.name = name;
    this.serviceForm.Enabled = d ? this.asText(coalesce(d.Enabled, d.enabled)) : '';
    this.serviceForm.AutheEnabled = d ? this.asText(coalesce(d.AutheEnabled, d.autheEnabled)) : '';
    this.serviceForm.ClientSystems = d ? this.asText(coalesce(d.ClientSystems, d.clientSystems)) : '';
    this.serviceForm.Description = d ? this.asText(coalesce(d.Description, d.description)) : '';
  }
  async saveService(): Promise<void> {
    const f = this.serviceForm;
    if (!f.name) return;
    try {
      await this.admin.client.domains.security.updateService(f.name, {
        name: f.name,
        Enabled: f.Enabled === 'true' || f.Enabled === 'True',
        AutheEnabled: f.AutheEnabled === 'true' || f.AutheEnabled === 'True',
        ClientSystems: f.ClientSystems,
        Description: f.Description,
      });
      await this.loadResSvc();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // SQL privileges
  async querySql(): Promise<void> {
    const ns = this.sqlNamespace;
    const g = this.sqlGrantee;
    if (!g) return;
    try {
      const [a, c, all] = await Promise.all([
        this.admin.client.domains.security.listSqlAdminPrivileges({ grantee: g, namespace: ns }).catch(() => []),
        ns ? this.admin.client.domains.security.listSqlColumnPrivileges({ grantee: g, namespace: ns }).catch(() => []) : Promise.resolve([]),
        ns ? this.admin.client.domains.security.listSqlPrivileges({ grantee: g, namespace: ns }).catch(() => []) : Promise.resolve([]),
      ]);
      this.sqlAdmin = Array.isArray(a) ? a : [];
      this.sqlColumn = Array.isArray(c) ? c : [];
      this.sqlAll = Array.isArray(all) ? all : [];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async sqlGrant(): Promise<void> {
    const f = this.sqlForm;
    if (!f.namespace || !f.grantee || !f.privilege) return;
    try {
      if (f.kind === 'column') {
        await this.admin.client.domains.security.grantSqlColumnPrivilege({
          namespace: f.namespace,
          grantee: f.grantee,
          table: f.table,
          column: f.column,
          privilege: f.privilege,
          action: f.action || 'grant',
        });
      } else {
        await this.admin.client.domains.security.grantSqlAdminPrivilege({ namespace: f.namespace, grantee: f.grantee, privilege: f.privilege });
      }
      this.sqlNamespace = f.namespace;
      this.sqlGrantee = f.grantee;
      await this.querySql();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async sqlRevoke(): Promise<void> {
    const f = this.sqlForm;
    if (!f.namespace || !f.grantee || !f.privilege) return;
    try {
      if (f.kind === 'column') {
        await this.admin.client.domains.security.revokeSqlColumnPrivilege({
          namespace: f.namespace,
          grantee: f.grantee,
          table: f.table,
          column: f.column,
          privilege: f.privilege,
          action: f.action || 'revoke',
        });
      } else {
        await this.admin.client.domains.security.revokeSqlAdminPrivilege({ namespace: f.namespace, grantee: f.grantee, privilege: f.privilege });
      }
      this.sqlNamespace = f.namespace;
      this.sqlGrantee = f.grantee;
      await this.querySql();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // Audit events
  async loadAuditEvents(): Promise<void> {
    try {
      const l = await this.admin.client.domains.logs.listAuditEvents();
      this.auditEvents = Array.isArray(l) ? l : [];
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  // The write endpoints require 3 query params (source/type/name); only `source`
  // (the full event name) is validated — `type` and `name` are not, so we send
  // safe fixed values.
  private auditQ(e: any): { source: string; type: string; name: string } {
    return { source: this.asText(coalesce(e?.EventName, e?.eventName, e?.Source, e?.source)), type: 'System', name: 'audit' };
  }
  openAuditEdit(e: any): void {
    this.auditForm.source = this.asText(coalesce(e.EventName, e.eventName));
    this.auditForm.enabled = !!coalesce(e.Enabled, e.enabled, true);
  }
  async saveAudit(): Promise<void> {
    const f = this.auditForm;
    if (!f.source) return;
    try {
      await this.admin.client.domains.security.updateAuditEvent(this.auditQ({ EventName: f.source }), { Enabled: !!f.enabled });
      await this.loadAuditEvents();
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async removeAudit(e: any): Promise<void> {
    this.auditConfirm = null;
    try { await this.admin.client.domains.security.removeAuditEvent(this.auditQ(e)); await this.loadAuditEvents(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async clearAuditCount(e: any): Promise<void> {
    try { await this.admin.client.domains.security.clearAuditEventCount(this.auditQ(e)); await this.loadAuditEvents(); }
    catch (e) { this.error = this.admin.errorMessage(e); }
  }

  // Web auth
  async loadWebAuth(): Promise<void> {
    try {
      this.webAuth = await this.admin.client.domains.permissions.getWebAuth();
      this.webAuthEntries = this.entries(this.webAuth);
      this.webAuthJson = JSON.stringify(this.webAuth, null, 2);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async saveWebAuth(): Promise<void> {
    if (!this.webAuthJson) return;
    try {
      const body = JSON.parse(this.webAuthJson) as Record<string, unknown>;
      this.webAuth = await this.admin.client.domains.permissions.setWebAuth(body);
      this.webAuthEntries = this.entries(this.webAuth);
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
  async changeSmtpPassword(): Promise<void> {
    if (!this.smtpPassword) return;
    try {
      await this.admin.client.domains.security.changeWebAuthSmtpPassword({ SMTPPassword: this.smtpPassword });
      this.smtpPassword = '';
    } catch (e) { this.error = this.admin.errorMessage(e); }
  }
}
