import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

type InstallmentSchedule = {
  installmentNo: number;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'Paid';
};

type InstallmentRecordView = {
  id: string;
  contractId: string;
  customerName: string;
  totalAmount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  firstDueDate: string;
  paymentMethod: string;
  schedules?: InstallmentSchedule[];
};

@Component({
  selector: 'app-dashboard-overview-feature',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="overview">
      <h2 class="dashboard__lede">Dashboard Overview</h2>
      <p class="dashboard__text">Monitor service activity and workload at a glance.</p>
      <div class="overview__widgets">
        <article class="widget"><p class="widget__label">Open Requests</p><p class="widget__value">128</p><p class="widget__trend widget__trend--up">+12% this week</p></article>
        <article class="widget"><p class="widget__label">Urgent Tickets</p><p class="widget__value">17</p><p class="widget__trend widget__trend--down">-3% from yesterday</p></article>
        <article class="widget"><p class="widget__label">Resolved Today</p><p class="widget__value">46</p><p class="widget__trend widget__trend--up">+8% productivity</p></article>
        <article class="widget"><p class="widget__label">SLA Compliance</p><p class="widget__value">94%</p><p class="widget__trend widget__trend--up">Healthy performance</p></article>
      </div>
      <div class="overview__charts">
        <article class="chart-card">
          <h3 class="chart-card__title">Service Mix</h3>
          <div class="chart-card__pie-wrap">
            <div class="chart-card__pie" role="img" aria-label="Service mix pie chart"></div>
            <ul class="chart-card__legend">
              <li><span class="dot dot--ac"></span> AC Maintainance (28%)</li>
              <li><span class="dot dot--electrical"></span> Electrical (22%)</li>
              <li><span class="dot dot--mechanical"></span> Mechanical (19%)</li>
              <li><span class="dot dot--floor"></span> Floor/Painting (16%)</li>
              <li><span class="dot dot--annual"></span> Annual Maintaince (15%)</li>
            </ul>
          </div>
        </article>
        <article class="chart-card">
          <h3 class="chart-card__title">Quick Insights</h3>
          <ul class="insight-list">
            <li>Peak arrival window: 10:00 - 12:00</li>
            <li>Most requested unit: Block A / Unit 12</li>
            <li>Helper required in 37% of today's jobs</li>
            <li>Cleaning requested in 44% of jobs</li>
          </ul>
        </article>
      </div>
    </section>
  `,
})
export class DashboardOverviewFeatureComponent {}

@Component({
  selector: 'app-dashboard-settings-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="request-card">
      <div class="request-card__header">
        <h2 class="dashboard__lede">Settings</h2>
        <p class="dashboard__text">Manage account, notification, and display preferences.</p>
      </div>
      @if (message) {
        <div class="request-card__alert">{{ message }}</div>
      }
      <form class="request-form" [formGroup]="form" (ngSubmit)="submit.emit()">
        <div class="request-form__grid">
          <label class="request-field">
            <span>Display Name</span>
            <input type="text" formControlName="displayName" />
          </label>
          <label class="request-field">
            <span>Email</span>
            <input type="email" formControlName="email" />
          </label>
          <label class="request-field">
            <span>Theme</span>
            <select formControlName="theme">
              @for (theme of themeOptions; track theme) {
                <option [value]="theme">{{ theme }}</option>
              }
            </select>
            <div class="settings-theme-picker">
              @for (theme of themeOptions; track theme) {
                <button
                  type="button"
                  class="settings-theme-chip"
                  [class.settings-theme-chip--active]="form.controls['theme'].value === theme"
                  (click)="selectTheme.emit(theme)"
                >
                  <span class="settings-theme-chip__swatch" [attr.data-theme-preview]="theme.toLowerCase()"></span>
                  <span>{{ theme }}</span>
                </button>
              }
            </div>
          </label>
          <label class="request-field">
            <span>Language</span>
            <select formControlName="language">
              @for (language of languageOptions; track language) {
                <option [value]="language">{{ language }}</option>
              }
            </select>
          </label>
          <label class="request-field">
            <span>Timezone</span>
            <select formControlName="timezone">
              @for (timezone of timezoneOptions; track timezone) {
                <option [value]="timezone">{{ timezone }}</option>
              }
            </select>
          </label>
          <label class="request-field">
            <span>Auto logout (minutes)</span>
            <input type="number" min="5" formControlName="autoLogoutMins" />
          </label>
        </div>
        <div class="request-form__checks">
          <label><input type="checkbox" formControlName="emailNotifications" /> Email notifications</label>
          <label><input type="checkbox" formControlName="smsNotifications" /> SMS notifications</label>
          <label><input type="checkbox" formControlName="compactView" /> Compact view mode</label>
        </div>
        <div class="request-form__actions">
          <button type="submit" class="request-btn request-btn--primary">Save Settings</button>
          <button type="button" class="request-btn" (click)="reset.emit()">Reset Defaults</button>
        </div>
        @if (lastUpdated) {
          <p class="dashboard__text settings__meta">Last updated: {{ lastUpdated }}</p>
        }
      </form>
    </section>
  `,
})
export class DashboardSettingsFeatureComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() message: string | null = null;
  @Input() lastUpdated: string | null = null;
  @Input() themeOptions: readonly string[] = [];
  @Input() languageOptions: readonly string[] = [];
  @Input() timezoneOptions: readonly string[] = [];
  @Output() submit = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() selectTheme = new EventEmitter<string>();
}

@Component({
  selector: 'app-dashboard-maintenance-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isAdmin) {
      <section class="request-card">
        <div class="request-card__header">
          <h2 class="dashboard__lede">Maintainance Requisition Form</h2>
          <p class="dashboard__text">Create, save, and email a new service request.</p>
        </div>
        @if (message) {
          <div class="request-card__alert">{{ message }}</div>
        }
        <form class="request-form" [formGroup]="form" (ngSubmit)="submit.emit()">
          <div class="request-form__grid">
            <label class="request-field"><span>User / BPartner</span><input type="text" formControlName="userOrBPartner" placeholder="Enter user or partner" /></label>
            <label class="request-field"><span>Location</span><input type="text" formControlName="location" placeholder="Enter location" /></label>
            <label class="request-field"><span>Unit</span><input type="text" formControlName="unit" placeholder="Enter unit" /></label>
            <label class="request-field"><span>Kind of Services</span><select formControlName="kindOfService"><option value="">Select kind of service</option>@for (service of serviceKinds; track service) {<option [value]="service">{{ service }}</option>}</select></label>
            <label class="request-field"><span>Priority Level</span><select formControlName="priorityLevel"><option value="">Select priority level</option>@for (priority of priorityLevels; track priority) {<option [value]="priority">{{ priority }}</option>}</select></label>
            <label class="request-field"><span>Service Required: Date & Time</span><input type="datetime-local" formControlName="serviceRequired" /></label>
            <label class="request-field"><span>Arrival Time: Date Time</span><input type="datetime-local" formControlName="arrivalTime" /></label>
          </div>
          <div class="request-form__checks">
            <label><input type="checkbox" formControlName="tenancyAvailable" /> Tenancy Availability</label>
            <label><input type="checkbox" formControlName="needHelper" /> Need Helper</label>
            <label><input type="checkbox" formControlName="needCleaning" /> Need Cleaning</label>
          </div>
          <div class="request-form__actions">
            <button type="submit" class="request-btn request-btn--primary">Send to create request</button>
            <button type="button" class="request-btn" (click)="cancel.emit()">Cancel</button>
            <button type="button" class="request-btn" (click)="edit.emit()">Edit</button>
          </div>
        </form>
      </section>
    } @else {
      <section class="request-card request-card--locked">
        <h2 class="dashboard__lede">Maintainance Requisition Form</h2>
        <p class="dashboard__text">Only admin users can access this form.</p>
      </section>
    }
  `,
})
export class DashboardMaintenanceFeatureComponent {
  @Input({ required: true }) isAdmin = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() message: string | null = null;
  @Input() serviceKinds: readonly string[] = [];
  @Input() priorityLevels: readonly string[] = [];
  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
}

@Component({
  selector: 'app-dashboard-simple-form-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isAdmin) {
      <section class="request-card">
        <div class="request-card__header">
          <h2 class="dashboard__lede">{{ title }}</h2>
          <p class="dashboard__text">{{ subtitle }}</p>
        </div>
        @if (message) {
          <div class="request-card__alert">{{ message }}</div>
        }
        <ng-content></ng-content>
      </section>
    } @else {
      <section class="request-card request-card--locked">
        <h2 class="dashboard__lede">{{ title }}</h2>
        <p class="dashboard__text">{{ lockedMessage }}</p>
      </section>
    }
  `,
})
export class DashboardSimpleFormFeatureComponent {
  @Input({ required: true }) isAdmin = false;
  @Input({ required: true }) title = '';
  @Input({ required: true }) subtitle = '';
  @Input({ required: true }) lockedMessage = '';
  @Input() message: string | null = null;
}

@Component({
  selector: 'app-dashboard-sla-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isAdmin) {
      <section class="request-card">
        <div class="request-card__header">
          <h2 class="dashboard__lede">SLA Feature</h2>
          <p class="dashboard__text">Define service response and resolution targets for operations.</p>
        </div>
        @if (message) { <div class="request-card__alert">{{ message }}</div> }
        <form class="request-form" [formGroup]="form" (ngSubmit)="submit.emit()">
          <div class="request-form__grid">
            <label class="request-field"><span>Response Target (minutes)</span><input type="number" min="1" formControlName="responseTargetMins" /></label>
            <label class="request-field"><span>Resolution Target (hours)</span><input type="number" min="1" formControlName="resolutionTargetHours" /></label>
            <label class="request-field"><span>Escalation After (minutes)</span><input type="number" min="1" formControlName="escalationAfterMins" /></label>
            <div class="request-field"><span>SLA Tracking</span><label class="request-toggle"><input type="checkbox" formControlName="enabled" /><span>Enable SLA monitoring</span></label></div>
            <div class="request-field"><span>Compliance Documents</span><div class="request-form__checks request-form__checks--tight"><label><input type="checkbox" formControlName="includeSlaDocument" /> SLA Document</label><label><input type="checkbox" formControlName="includeNda" /> NDA</label></div></div>
            <label class="request-field"><span>Attach SLA document / NDA</span><input type="file" accept=".pdf,.doc,.docx" (change)="fileSelected.emit($event)" />@if (attachmentName) { <small class="request-field__meta">Selected: {{ attachmentName }}</small> }</label>
          </div>
          <div class="request-form__actions"><button type="submit" class="request-btn request-btn--primary">Save SLA</button></div>
        </form>
      </section>
    } @else {
      <section class="request-card request-card--locked"><h2 class="dashboard__lede">SLA Feature</h2><p class="dashboard__text">Only admin users can access SLA configuration.</p></section>
    }
  `,
})
export class DashboardSlaFeatureComponent {
  @Input() isAdmin = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() message: string | null = null;
  @Input() attachmentName = '';
  @Output() submit = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<Event>();
}

@Component({
  selector: 'app-dashboard-enquiry-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isAdmin) {
      <section class="request-card">
        <div class="request-card__header"><h2 class="dashboard__lede">Enquiry Form</h2><p class="dashboard__text">Share your service enquiry and our team will reach out.</p></div>
        @if (message) { <div class="request-card__alert">{{ message }}</div> }
        <form class="request-form" [formGroup]="form" (ngSubmit)="submit.emit()">
          <div class="request-form__grid">
            <label class="request-field"><span>Customer Name</span><input type="text" formControlName="customerName" /></label>
            <label class="request-field"><span>Company Name</span><input type="text" formControlName="companyName" /></label>
            <label class="request-field"><span>Email</span><input type="email" formControlName="email" /></label>
            <label class="request-field"><span>Phone</span><input type="tel" formControlName="phone" /></label>
            <label class="request-field"><span>Enquiry Type</span><select formControlName="enquiryType"><option value="">Select enquiry type</option>@for (type of enquiryTypes; track type) { <option [value]="type">{{ type }}</option> }</select></label>
            <label class="request-field"><span>Preferred Contact</span><select formControlName="preferredContact">@for (mode of contactModes; track mode) { <option [value]="mode">{{ mode }}</option> }</select></label>
            <label class="request-field request-field--wide"><span>Message</span><textarea rows="4" formControlName="message"></textarea></label>
          </div>
          <div class="request-form__actions"><button type="submit" class="request-btn request-btn--primary">Submit Enquiry</button></div>
        </form>
      </section>
    } @else {
      <section class="request-card request-card--locked"><h2 class="dashboard__lede">Enquiry Form</h2><p class="dashboard__text">Only admin users can access enquiry form.</p></section>
    }
  `,
})
export class DashboardEnquiryFeatureComponent {
  @Input() isAdmin = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() message: string | null = null;
  @Input() enquiryTypes: readonly string[] = [];
  @Input() contactModes: readonly string[] = [];
  @Output() submit = new EventEmitter<void>();
}

@Component({
  selector: 'app-dashboard-order-leads-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isAdmin) {
      <section class="request-card">
        <div class="request-card__header"><h2 class="dashboard__lede">Order Leads Form</h2><p class="dashboard__text">Capture product and budget details for your upcoming order.</p></div>
        @if (message) { <div class="request-card__alert">{{ message }}</div> }
        <form class="request-form" [formGroup]="form" (ngSubmit)="submit.emit()">
          <div class="request-form__grid">
            <label class="request-field"><span>Customer Name</span><input type="text" formControlName="customerName" /></label>
            <label class="request-field"><span>Company Name</span><input type="text" formControlName="companyName" /></label>
            <label class="request-field"><span>Product / Service</span><input type="text" formControlName="productService" /></label>
            <label class="request-field"><span>Quantity</span><input type="number" min="1" formControlName="quantity" /></label>
            <label class="request-field"><span>Expected Budget</span><input type="number" min="1" formControlName="expectedBudget" /></label>
            <label class="request-field"><span>Expected Closing Date</span><input type="date" formControlName="expectedClosingDate" /></label>
            <label class="request-field"><span>Lead Source</span><select formControlName="leadSource">@for (source of leadSources; track source) { <option [value]="source">{{ source }}</option> }</select></label>
            <label class="request-field request-field--wide"><span>Notes</span><textarea rows="4" formControlName="notes"></textarea></label>
          </div>
          <div class="request-form__actions"><button type="submit" class="request-btn request-btn--primary">Save Order Lead</button></div>
        </form>
      </section>
    } @else {
      <section class="request-card request-card--locked"><h2 class="dashboard__lede">Order Leads Form</h2><p class="dashboard__text">Only admin users can access order leads form.</p></section>
    }
  `,
})
export class DashboardOrderLeadsFeatureComponent {
  @Input() isAdmin = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() message: string | null = null;
  @Input() leadSources: readonly string[] = [];
  @Output() submit = new EventEmitter<void>();
}

@Component({
  selector: 'app-dashboard-contract-renewal-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isAdmin) {
      <section class="request-card">
        <div class="request-card__header"><h2 class="dashboard__lede">Existing Contract Renewal Form</h2><p class="dashboard__text">Renew active contracts with period, payment, and installment details.</p></div>
        @if (message) { <div class="request-card__alert">{{ message }}</div> }
        <form class="request-form" [formGroup]="form" (ngSubmit)="submit.emit()">
          <div class="request-form__grid">
            <label class="request-field"><span>Contract ID</span><input type="text" formControlName="contractId" /></label>
            <label class="request-field"><span>Customer Name</span><input type="text" formControlName="customerName" /></label>
            <label class="request-field"><span>Contract Start Date</span><input type="date" formControlName="contractStartDate" /></label>
            <label class="request-field"><span>Contract End Date</span><input type="date" formControlName="contractEndDate" /></label>
            <label class="request-field"><span>Renewal Period (months)</span><input type="number" min="1" formControlName="renewalPeriodMonths" /></label>
            <label class="request-field"><span>Renewal Amount</span><input type="number" min="1" formControlName="renewalAmount" /></label>
            <label class="request-field"><span>Payment Method</span><select formControlName="paymentMethod">@for (paymentMethod of paymentMethods; track paymentMethod) { <option [value]="paymentMethod">{{ paymentMethod }}</option> }</select></label>
            <label class="request-field"><span>Installements</span><input type="number" min="1" formControlName="installments" /></label>
            <label class="request-field"><span>Contract Attachment</span><input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" (change)="fileSelected.emit($event)" />@if (attachmentName) { <small class="request-field__meta">Selected: {{ attachmentName }}</small> }</label>
            <label class="request-field request-field--wide"><span>Notes</span><textarea rows="4" formControlName="notes"></textarea></label>
          </div>
          <div class="request-form__actions"><button type="submit" class="request-btn request-btn--primary">Save Contract Renewal</button></div>
        </form>
      </section>
    } @else {
      <section class="request-card request-card--locked"><h2 class="dashboard__lede">Existing Contract Renewal Form</h2><p class="dashboard__text">Only admin users can access existing contract renewal form.</p></section>
    }
  `,
})
export class DashboardContractRenewalFeatureComponent {
  @Input() isAdmin = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() message: string | null = null;
  @Input() paymentMethods: readonly string[] = [];
  @Input() attachmentName = '';
  @Output() submit = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<Event>();
}

@Component({
  selector: 'app-dashboard-payment-method-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isAdmin) {
      <section class="request-card">
        <div class="request-card__header"><h2 class="dashboard__lede">Payment Method Form</h2><p class="dashboard__text">Capture payment details for contract renewal tracking.</p></div>
        @if (message) { <div class="request-card__alert">{{ message }}</div> }
        <form class="request-form" [formGroup]="form" (ngSubmit)="submit.emit()">
          <div class="request-form__grid">
            <label class="request-field"><span>Contract ID</span><input type="text" formControlName="contractId" /></label>
            <label class="request-field"><span>Customer Name</span><input type="text" formControlName="customerName" /></label>
            <label class="request-field"><span>Payment Method</span><select formControlName="paymentMethod">@for (paymentMethod of paymentMethods; track paymentMethod) { <option [value]="paymentMethod">{{ paymentMethod }}</option> }</select></label>
            <label class="request-field"><span>Paid Amount</span><input type="number" min="1" formControlName="paidAmount" /></label>
            <label class="request-field"><span>Payment Date</span><input type="date" formControlName="paymentDate" /></label>
            <label class="request-field"><span>Transaction Reference</span><input type="text" formControlName="transactionReference" /></label>
            <label class="request-field request-field--wide"><span>Notes</span><textarea rows="4" formControlName="notes"></textarea></label>
          </div>
          <div class="request-form__actions"><button type="submit" class="request-btn request-btn--primary">Save Payment Method</button></div>
        </form>
      </section>
    } @else {
      <section class="request-card request-card--locked"><h2 class="dashboard__lede">Payment Method Form</h2><p class="dashboard__text">Only admin users can access payment method form.</p></section>
    }
  `,
})
export class DashboardPaymentMethodFeatureComponent {
  @Input() isAdmin = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() message: string | null = null;
  @Input() paymentMethods: readonly string[] = [];
  @Output() submit = new EventEmitter<void>();
}

@Component({
  selector: 'app-dashboard-installments-form-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isAdmin) {
      <section class="request-card">
        <div class="request-card__header"><h2 class="dashboard__lede">{{ editingInstallmentId ? 'Installements - Update' : 'Installements - Add New' }}</h2><p class="dashboard__text">Capture installment plans for renewed contracts.</p></div>
        @if (message) { <div class="request-card__alert">{{ message }}</div> }
        <form class="request-form" [formGroup]="form" (ngSubmit)="submit.emit()">
          <div class="request-form__grid">
            <label class="request-field"><span>Contract ID</span><input type="text" formControlName="contractId" /></label>
            <label class="request-field"><span>Customer Name</span><input type="text" formControlName="customerName" /></label>
            <label class="request-field"><span>Total Amount</span><input type="number" min="1" formControlName="totalAmount" (input)="recalculate.emit()" /></label>
            <label class="request-field"><span>Number of Installements</span><input type="number" min="1" formControlName="numberOfInstallments" (input)="recalculate.emit()" /></label>
            <label class="request-field"><span>Installement Amount</span><input type="number" min="1" formControlName="installmentAmount" readonly /></label>
            <label class="request-field"><span>First Due Date</span><input type="date" formControlName="firstDueDate" /></label>
            <label class="request-field"><span>Payment Method</span><select formControlName="paymentMethod">@for (paymentMethod of paymentMethods; track paymentMethod) { <option [value]="paymentMethod">{{ paymentMethod }}</option> }</select></label>
            <label class="request-field request-field--wide"><span>Notes</span><textarea rows="4" formControlName="notes"></textarea></label>
          </div>
          <div class="request-form__actions">
            <button type="submit" class="request-btn request-btn--primary">{{ editingInstallmentId ? 'Update Installements' : 'Save Installements' }}</button>
            @if (editingInstallmentId) { <button type="button" class="request-btn" (click)="cancelEdit.emit()">Cancel Edit</button> }
          </div>
        </form>
      </section>
    } @else {
      <section class="request-card request-card--locked"><h2 class="dashboard__lede">Installements - Add New</h2><p class="dashboard__text">Only admin users can access installments form.</p></section>
    }
  `,
})
export class DashboardInstallmentsFormFeatureComponent {
  @Input() isAdmin = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() message: string | null = null;
  @Input() paymentMethods: readonly string[] = [];
  @Input() editingInstallmentId: string | null = null;
  @Output() submit = new EventEmitter<void>();
  @Output() recalculate = new EventEmitter<void>();
  @Output() cancelEdit = new EventEmitter<void>();
}

@Component({
  selector: 'app-dashboard-installments-view-feature',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isAdmin) {
      <section class="request-card">
        <div class="request-card__header">
          <h2 class="dashboard__lede">Installements - View All</h2>
          <p class="dashboard__text">All saved installment plans for different customers.</p>
        </div>
        @if (message) {
          <div class="request-card__alert">{{ message }}</div>
        }
        <label class="request-field">
          <span>Search by Customer</span>
          <input type="search" placeholder="Enter customer name..." [value]="searchTerm" (input)="searchTermChange.emit($any($event.target).value)" />
        </label>
        <div class="record-list">
          <h3 class="dashboard__lede">Saved Installements</h3>
          @if (records.length === 0) {
            <p class="dashboard__text">No installment plans saved yet.</p>
          } @else {
            <div class="record-list__grid">
              @for (item of records; track item.id) {
                <article class="record-card">
                  <p><strong>{{ item.id }}</strong></p><p><strong>Contract:</strong> {{ item.contractId }}</p><p><strong>Customer:</strong> {{ item.customerName }}</p>
                  <p><strong>Total:</strong> {{ item.totalAmount }}</p><p><strong>Installments:</strong> {{ item.numberOfInstallments }}</p>
                  <p><strong>Per Installment:</strong> {{ item.installmentAmount }}</p><p><strong>Due Date:</strong> {{ item.firstDueDate }}</p><p><strong>Method:</strong> {{ item.paymentMethod }}</p>
                  @if (item.schedules?.length) {
                    <p><strong>Payment Schedule:</strong></p>
                    @for (schedule of item.schedules; track schedule.installmentNo) {
                      @if (editingScheduleKey === item.id + '-' + schedule.installmentNo) {
                        <div class="request-form__grid">
                          <label class="request-field"><span>Due Date</span><input type="date" [value]="scheduleDraftDueDate" (input)="scheduleDraftDueDateChange.emit($any($event.target).value)" /></label>
                          <label class="request-field"><span>Amount</span><input type="number" min="1" [value]="scheduleDraftAmount" (input)="scheduleDraftAmountChange.emit(+$any($event.target).value)" /></label>
                          <label class="request-field"><span>Status</span><select [value]="scheduleDraftStatus" (change)="scheduleDraftStatusChange.emit($any($event.target).value)"><option value="Pending">Pending</option><option value="Paid">Paid</option></select></label>
                        </div>
                        <div class="request-form__actions">
                          <button type="button" class="request-btn request-btn--primary" (click)="saveSchedule.emit({ installmentId: item.id, installmentNo: schedule.installmentNo })">Save Schedule</button>
                          <button type="button" class="request-btn" (click)="cancelSchedule.emit()">Cancel</button>
                        </div>
                      } @else {
                        <p>#{{ schedule.installmentNo }} - {{ schedule.dueDate }} - {{ schedule.amount }} ({{ schedule.status }})</p>
                        <button type="button" class="request-btn" (click)="startSchedule.emit({ installmentId: item.id, installmentNo: schedule.installmentNo })">Reschedule / Edit</button>
                      }
                    }
                  }
                  <div class="request-form__actions">
                    <button type="button" class="request-btn" (click)="edit.emit(item.id)">Update</button>
                    <button type="button" class="request-btn" (click)="delete.emit(item.id)">Delete</button>
                  </div>
                </article>
              }
            </div>
          }
        </div>
      </section>
    } @else {
      <section class="request-card request-card--locked">
        <h2 class="dashboard__lede">Installements - View All</h2>
        <p class="dashboard__text">Only admin users can view saved installment plans.</p>
      </section>
    }
  `,
})
export class DashboardInstallmentsViewFeatureComponent {
  @Input() isAdmin = false;
  @Input() message: string | null = null;
  @Input() records: InstallmentRecordView[] = [];
  @Input() searchTerm = '';
  @Input() editingScheduleKey: string | null = null;
  @Input() scheduleDraftDueDate = '';
  @Input() scheduleDraftAmount = 0;
  @Input() scheduleDraftStatus: 'Pending' | 'Paid' = 'Pending';
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() startSchedule = new EventEmitter<{ installmentId: string; installmentNo: number }>();
  @Output() cancelSchedule = new EventEmitter<void>();
  @Output() saveSchedule = new EventEmitter<{ installmentId: string; installmentNo: number }>();
  @Output() scheduleDraftDueDateChange = new EventEmitter<string>();
  @Output() scheduleDraftAmountChange = new EventEmitter<number>();
  @Output() scheduleDraftStatusChange = new EventEmitter<'Pending' | 'Paid'>();
}
