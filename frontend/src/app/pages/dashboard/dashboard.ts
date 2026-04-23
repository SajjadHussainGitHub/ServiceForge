import { ChangeDetectionStrategy, Component, HostListener, ViewEncapsulation, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import {
  DashboardContractRenewalFeatureComponent,
  DashboardEnquiryFeatureComponent,
  DashboardInstallmentsFormFeatureComponent,
  DashboardInstallmentsViewFeatureComponent,
  DashboardMaintenanceFeatureComponent,
  DashboardOrderLeadsFeatureComponent,
  DashboardOverviewFeatureComponent,
  DashboardPaymentMethodFeatureComponent,
  DashboardSettingsFeatureComponent,
  DashboardSlaFeatureComponent,
} from './components/dashboard-feature-components';
import { Footer } from './footer/footer';
import { Header } from './header/header';
import { DashboardMenu, Sidebar } from './sidebar/sidebar';

const SIDEBAR_STATE_KEY = 'serviceforge_sidebar_collapsed';
const MAINTENANCE_REQUESTS_KEY = 'serviceforge_maintenance_requests';
const SLA_CONFIG_KEY = 'serviceforge_sla_config';
const ENQUIRY_RECORDS_KEY = 'serviceforge_enquiry_records';
const ORDER_LEAD_RECORDS_KEY = 'serviceforge_order_lead_records';
const CONTRACT_RENEWAL_RECORDS_KEY = 'serviceforge_contract_renewals';
const PAYMENT_METHOD_RECORDS_KEY = 'serviceforge_payment_methods';
const INSTALLMENT_RECORDS_KEY = 'serviceforge_installments';
const SETTINGS_CONFIG_KEY = 'serviceforge_settings';

type MaintenanceRequest = {
  id: string;
  createdAt: string;
  createdByRole: 'admin' | 'customer' | null;
  userOrBPartner: string;
  location: string;
  unit: string;
  kindOfService: string;
  priorityLevel: string;
  tenancyAvailable: boolean;
  serviceRequired: string;
  needHelper: boolean;
  needCleaning: boolean;
  arrivalTime: string;
};

type SlaConfig = {
  responseTargetMins: number;
  resolutionTargetHours: number;
  escalationAfterMins: number;
  enabled: boolean;
  includeSlaDocument: boolean;
  includeNda: boolean;
  attachmentName: string;
};

type EnquiryRecord = {
  id: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  enquiryType: string;
  message: string;
  preferredContact: string;
  createdAt: string;
  createdByRole: 'admin' | 'customer' | null;
};

type OrderLeadRecord = {
  id: string;
  customerName: string;
  companyName: string;
  productService: string;
  quantity: number;
  expectedBudget: number;
  expectedClosingDate: string;
  leadSource: string;
  notes: string;
  createdAt: string;
  createdByRole: 'admin' | 'customer' | null;
};

type ContractRenewalRecord = {
  id: string;
  contractId: string;
  customerName: string;
  contractStartDate: string;
  contractEndDate: string;
  renewalPeriodMonths: number;
  renewalAmount: number;
  paymentMethod: string;
  installments: number;
  attachmentName: string;
  notes: string;
  createdAt: string;
  createdByRole: 'admin' | 'customer' | null;
};

type PaymentMethodRecord = {
  id: string;
  contractId: string;
  customerName: string;
  paymentMethod: string;
  paidAmount: number;
  paymentDate: string;
  transactionReference: string;
  notes: string;
  createdAt: string;
  createdByRole: 'admin' | 'customer' | null;
};

type InstallmentRecord = {
  id: string;
  contractId: string;
  customerName: string;
  totalAmount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  firstDueDate: string;
  paymentMethod: string;
  notes: string;
  schedules?: Array<{ installmentNo: number; dueDate: string; amount: number; status: 'Pending' | 'Paid' }>;
  createdAt: string;
  createdByRole: 'admin' | 'customer' | null;
};

type DashboardSettings = {
  displayName: string;
  email: string;
  theme: string;
  language: string;
  timezone: string;
  autoLogoutMins: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  compactView: boolean;
  updatedAt: string;
};

@Component({
  selector: 'app-dashboard',
  imports: [
    ReactiveFormsModule,
    Footer,
    Header,
    Sidebar,
    DashboardOverviewFeatureComponent,
    DashboardSettingsFeatureComponent,
    DashboardMaintenanceFeatureComponent,
    DashboardSlaFeatureComponent,
    DashboardEnquiryFeatureComponent,
    DashboardOrderLeadsFeatureComponent,
    DashboardContractRenewalFeatureComponent,
    DashboardPaymentMethodFeatureComponent,
    DashboardInstallmentsFormFeatureComponent,
    DashboardInstallmentsViewFeatureComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isSidebarCollapsed = signal(this.getInitialSidebarState());
  readonly activeMenu = signal<DashboardMenu>('overview');
  readonly displayName = signal('Sajjad Admin');
  readonly requestMessage = signal<string | null>(null);
  readonly settingsMessage = signal<string | null>(null);
  readonly settingsLastUpdated = signal<string | null>(null);
  readonly slaMessage = signal<string | null>(null);
  readonly slaAttachmentName = signal<string>('');
  readonly enquiryMessage = signal<string | null>(null);
  readonly orderLeadMessage = signal<string | null>(null);
  readonly contractRenewalMessage = signal<string | null>(null);
  readonly contractAttachmentName = signal<string>('');
  readonly paymentMethodMessage = signal<string | null>(null);
  readonly installmentMessage = signal<string | null>(null);
  readonly installmentRecords = signal<InstallmentRecord[]>([]);
  readonly editingInstallmentId = signal<string | null>(null);
  readonly installmentSearchTerm = signal<string>('');
  readonly editingScheduleKey = signal<string | null>(null);
  readonly scheduleDraftDueDate = signal<string>('');
  readonly scheduleDraftAmount = signal<number>(0);
  readonly scheduleDraftStatus = signal<'Pending' | 'Paid'>('Pending');
  readonly serviceKinds = [
    'AC Maintainance',
    'Electrical',
    'Mechanical',
    'Floor Maitaince',
    'Painting',
    'Annual Maintaince',
  ] as const;
  readonly priorityLevels = ['High', 'Medium', 'Urgent'] as const;
  readonly themeOptions = ['System', 'Light', 'Dark', 'Midnight', 'Forest', 'Sunset'] as const;
  readonly languageOptions = ['English', 'Arabic', 'Urdu'] as const;
  readonly timezoneOptions = ['Asia/Dubai', 'Asia/Karachi', 'Asia/Riyadh', 'UTC'] as const;
  readonly enquiryTypes = ['General', 'Service', 'Complaint', 'Feedback'] as const;
  readonly contactModes = ['Email', 'Phone', 'WhatsApp'] as const;
  readonly leadSources = ['Website', 'Referral', 'Sales Call', 'Walk-In'] as const;
  readonly paymentMethods = ['Cash', 'Card/Cheque'] as const;

  readonly maintenanceForm = this.fb.nonNullable.group({
    userOrBPartner: ['', [Validators.required]],
    location: ['', [Validators.required]],
    unit: ['', [Validators.required]],
    kindOfService: ['', [Validators.required]],
    priorityLevel: ['', [Validators.required]],
    tenancyAvailable: [false],
    serviceRequired: ['', [Validators.required]],
    needHelper: [false],
    needCleaning: [false],
    arrivalTime: ['', [Validators.required]],
  });

  readonly settingsForm = this.fb.nonNullable.group({
    displayName: ['Sajjad Admin', [Validators.required]],
    email: ['admin@serviceforge.com', [Validators.required, Validators.email]],
    theme: ['System', [Validators.required]],
    language: ['English', [Validators.required]],
    timezone: ['Asia/Dubai', [Validators.required]],
    autoLogoutMins: [30, [Validators.required, Validators.min(5)]],
    emailNotifications: [true],
    smsNotifications: [false],
    compactView: [false],
  });

  readonly slaForm = this.fb.nonNullable.group({
    responseTargetMins: [30, [Validators.required, Validators.min(1)]],
    resolutionTargetHours: [8, [Validators.required, Validators.min(1)]],
    escalationAfterMins: [60, [Validators.required, Validators.min(1)]],
    enabled: [true],
    includeSlaDocument: [true],
    includeNda: [false],
  });

  readonly enquiryForm = this.fb.nonNullable.group({
    customerName: ['', [Validators.required]],
    companyName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    enquiryType: ['', [Validators.required]],
    message: ['', [Validators.required]],
    preferredContact: ['Email', [Validators.required]],
  });

  readonly orderLeadForm = this.fb.nonNullable.group({
    customerName: ['', [Validators.required]],
    companyName: ['', [Validators.required]],
    productService: ['', [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    expectedBudget: [1000, [Validators.required, Validators.min(1)]],
    expectedClosingDate: ['', [Validators.required]],
    leadSource: ['Website', [Validators.required]],
    notes: [''],
  });

  readonly contractRenewalForm = this.fb.nonNullable.group({
    contractId: ['', [Validators.required]],
    customerName: ['', [Validators.required]],
    contractStartDate: ['', [Validators.required]],
    contractEndDate: ['', [Validators.required]],
    renewalPeriodMonths: [12, [Validators.required, Validators.min(1)]],
    renewalAmount: [5000, [Validators.required, Validators.min(1)]],
    paymentMethod: ['Cash', [Validators.required]],
    installments: [1, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  readonly paymentMethodForm = this.fb.nonNullable.group({
    contractId: ['', [Validators.required]],
    customerName: ['', [Validators.required]],
    paymentMethod: ['Cash', [Validators.required]],
    paidAmount: [1000, [Validators.required, Validators.min(1)]],
    paymentDate: ['', [Validators.required]],
    transactionReference: [''],
    notes: [''],
  });

  readonly installmentForm = this.fb.nonNullable.group({
    contractId: ['', [Validators.required]],
    customerName: ['', [Validators.required]],
    totalAmount: [10000, [Validators.required, Validators.min(1)]],
    numberOfInstallments: [3, [Validators.required, Validators.min(1)]],
    installmentAmount: [3333, [Validators.required, Validators.min(1)]],
    firstDueDate: ['', [Validators.required]],
    paymentMethod: ['Cash', [Validators.required]],
    notes: [''],
  });

  constructor() {
    const saved = localStorage.getItem(SLA_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<SlaConfig>;
        this.slaForm.patchValue({
          responseTargetMins: parsed.responseTargetMins ?? 30,
          resolutionTargetHours: parsed.resolutionTargetHours ?? 8,
          escalationAfterMins: parsed.escalationAfterMins ?? 60,
          enabled: parsed.enabled ?? true,
          includeSlaDocument: parsed.includeSlaDocument ?? true,
          includeNda: parsed.includeNda ?? false,
        });
        this.slaAttachmentName.set(parsed.attachmentName ?? '');
      } catch {
        // Keep defaults when invalid local config exists.
      }
    }
    this.recalculateInstallmentAmount();
    this.installmentRecords.set(this.readStorageArray<InstallmentRecord>(INSTALLMENT_RECORDS_KEY));
    this.loadSettings();
    this.settingsForm.controls.theme.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((theme) => this.applyThemePreference(theme));
    this.settingsForm.controls.compactView.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((compact) => this.applyCompactMode(compact));
    this.settingsForm.controls.displayName.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.displayName.set(value || 'Sajjad Admin'));
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  isCustomer(): boolean {
    return this.auth.currentRole() === 'customer';
  }

  selectMenu(menu: DashboardMenu): void {
    this.activeMenu.set(menu);
    if (window.matchMedia('(max-width: 900px)').matches) {
      this.closeSidebar();
    }
  }

  saveSettings(): void {
    this.settingsMessage.set(null);
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }
    const config: DashboardSettings = {
      ...this.settingsForm.getRawValue(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SETTINGS_CONFIG_KEY, JSON.stringify(config));
    this.settingsLastUpdated.set(new Date(config.updatedAt).toLocaleString());
    this.applyThemePreference(config.theme);
    this.applyCompactMode(config.compactView);
    this.displayName.set(config.displayName);
    this.settingsMessage.set('Settings saved successfully.');
  }

  resetSettings(): void {
    this.settingsForm.reset({
      displayName: 'Sajjad Admin',
      email: 'admin@serviceforge.com',
      theme: 'System',
      language: 'English',
      timezone: 'Asia/Dubai',
      autoLogoutMins: 30,
      emailNotifications: true,
      smsNotifications: false,
      compactView: false,
    });
    localStorage.removeItem(SETTINGS_CONFIG_KEY);
    this.settingsLastUpdated.set(null);
    this.applyThemePreference('System');
    this.applyCompactMode(false);
    this.displayName.set('Sajjad Admin');
    this.settingsMessage.set('Settings reset to defaults.');
  }

  setTheme(theme: string): void {
    this.settingsForm.controls.theme.setValue(theme);
  }

  toggleSidebar(): void {
    const next = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(next);
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(next));
  }

  closeSidebar(): void {
    if (!this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(true);
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(true));
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.closeSidebar();
  }

  sendRequest(): void {
    this.requestMessage.set(null);
    if (!this.isAdmin()) {
      this.requestMessage.set('Only admin can create maintenance requisitions.');
      return;
    }
    if (this.maintenanceForm.invalid) {
      this.maintenanceForm.markAllAsTouched();
      return;
    }

    const data = this.maintenanceForm.getRawValue();
    const record: MaintenanceRequest = {
      id: `MR-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdByRole: this.auth.currentRole(),
      ...data,
    };
    const existing = this.readRequests();
    existing.unshift(record);
    localStorage.setItem(MAINTENANCE_REQUESTS_KEY, JSON.stringify(existing));

    const subject = `Maintenance Requisition ${record.id}`;
    const bodyLines = [
      `Request ID: ${record.id}`,
      `User / BPartner: ${record.userOrBPartner}`,
      `Location: ${record.location}`,
      `Unit: ${record.unit}`,
      `Kind of Services: ${record.kindOfService}`,
      `Priority Level: ${record.priorityLevel}`,
      `Tenancy Availability: ${record.tenancyAvailable ? 'Yes' : 'No'}`,
      `Service Required: ${record.serviceRequired}`,
      `Need Helper: ${record.needHelper ? 'Yes' : 'No'}`,
      `Need Cleaning: ${record.needCleaning ? 'Yes' : 'No'}`,
      `Arrival Time: ${record.arrivalTime}`,
    ];
    window.location.href = `mailto:service@serviceforge.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    this.requestMessage.set(`Request ${record.id} created, email draft generated, and record saved.`);
    this.maintenanceForm.reset({
      userOrBPartner: '',
      location: '',
      unit: '',
      kindOfService: '',
      priorityLevel: '',
      tenancyAvailable: false,
      serviceRequired: '',
      needHelper: false,
      needCleaning: false,
      arrivalTime: '',
    });
  }

  cancelModify(): void {
    this.requestMessage.set('Changes canceled.');
    this.maintenanceForm.reset({
      userOrBPartner: '',
      location: '',
      unit: '',
      kindOfService: '',
      priorityLevel: '',
      tenancyAvailable: false,
      serviceRequired: '',
      needHelper: false,
      needCleaning: false,
      arrivalTime: '',
    });
  }

  editLatestRequest(): void {
    const latest = this.readRequests()[0];
    if (!latest) {
      this.requestMessage.set('No existing request found to edit.');
      return;
    }
    this.maintenanceForm.patchValue({
      userOrBPartner: latest.userOrBPartner ?? '',
      location: latest.location ?? '',
      unit: latest.unit ?? '',
      kindOfService: latest.kindOfService ?? '',
      priorityLevel: latest.priorityLevel ?? '',
      tenancyAvailable: !!latest.tenancyAvailable,
      serviceRequired: latest.serviceRequired ?? '',
      needHelper: !!latest.needHelper,
      needCleaning: !!latest.needCleaning,
      arrivalTime: latest.arrivalTime ?? '',
    });
    this.requestMessage.set(`Loaded ${latest.id} for editing.`);
  }

  saveSla(): void {
    this.slaMessage.set(null);
    if (!this.isAdmin()) {
      this.slaMessage.set('Only admin can update SLA configuration.');
      return;
    }
    if (this.slaForm.invalid) {
      this.slaForm.markAllAsTouched();
      return;
    }
    const config: SlaConfig = {
      ...this.slaForm.getRawValue(),
      attachmentName: this.slaAttachmentName(),
    };
    localStorage.setItem(SLA_CONFIG_KEY, JSON.stringify(config));
    this.slaMessage.set('SLA configuration saved successfully.');
  }

  onSlaDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.slaAttachmentName.set(file?.name ?? '');
  }

  submitEnquiry(): void {
    this.enquiryMessage.set(null);
    if (!this.isAdmin()) {
      this.enquiryMessage.set('Only admin can submit enquiry.');
      return;
    }
    if (this.enquiryForm.invalid) {
      this.enquiryForm.markAllAsTouched();
      return;
    }
    const record: EnquiryRecord = {
      id: `ENQ-${Date.now()}`,
      ...this.enquiryForm.getRawValue(),
      createdAt: new Date().toISOString(),
      createdByRole: this.auth.currentRole(),
    };
    const existing = this.readStorageArray<EnquiryRecord>(ENQUIRY_RECORDS_KEY);
    existing.unshift(record);
    localStorage.setItem(ENQUIRY_RECORDS_KEY, JSON.stringify(existing));
    this.enquiryMessage.set(`Enquiry ${record.id} submitted successfully.`);
    this.enquiryForm.reset({
      customerName: '',
      companyName: '',
      email: '',
      phone: '',
      enquiryType: '',
      message: '',
      preferredContact: 'Email',
    });
  }

  submitOrderLead(): void {
    this.orderLeadMessage.set(null);
    if (!this.isAdmin()) {
      this.orderLeadMessage.set('Only admin can submit order leads.');
      return;
    }
    if (this.orderLeadForm.invalid) {
      this.orderLeadForm.markAllAsTouched();
      return;
    }
    const record: OrderLeadRecord = {
      id: `LEAD-${Date.now()}`,
      ...this.orderLeadForm.getRawValue(),
      createdAt: new Date().toISOString(),
      createdByRole: this.auth.currentRole(),
    };
    const existing = this.readStorageArray<OrderLeadRecord>(ORDER_LEAD_RECORDS_KEY);
    existing.unshift(record);
    localStorage.setItem(ORDER_LEAD_RECORDS_KEY, JSON.stringify(existing));
    this.orderLeadMessage.set(`Order lead ${record.id} saved successfully.`);
    this.orderLeadForm.reset({
      customerName: '',
      companyName: '',
      productService: '',
      quantity: 1,
      expectedBudget: 1000,
      expectedClosingDate: '',
      leadSource: 'Website',
      notes: '',
    });
  }

  submitExistingContractRenewal(): void {
    this.contractRenewalMessage.set(null);
    if (!this.isAdmin()) {
      this.contractRenewalMessage.set('Only admin can submit existing contract renewal.');
      return;
    }
    if (this.contractRenewalForm.invalid) {
      this.contractRenewalForm.markAllAsTouched();
      return;
    }
    const record: ContractRenewalRecord = {
      id: `REN-${Date.now()}`,
      ...this.contractRenewalForm.getRawValue(),
      attachmentName: this.contractAttachmentName(),
      createdAt: new Date().toISOString(),
      createdByRole: this.auth.currentRole(),
    };
    const existing = this.readStorageArray<ContractRenewalRecord>(CONTRACT_RENEWAL_RECORDS_KEY);
    existing.unshift(record);
    localStorage.setItem(CONTRACT_RENEWAL_RECORDS_KEY, JSON.stringify(existing));

    // Auto-create installment plan + payment schedule from renewal details.
    const installmentCount = Math.max(1, Number(record.installments || 1));
    const totalAmount = Number(record.renewalAmount || 0);
    const perInstallmentAmount = Number((totalAmount / installmentCount).toFixed(2));
    const firstDueDate = record.contractEndDate || '';
    const schedules = Array.from({ length: installmentCount }, (_, index) => ({
      installmentNo: index + 1,
      dueDate: this.addMonthsToDate(firstDueDate, index),
      amount: perInstallmentAmount,
      status: 'Pending' as const,
    }));

    const installmentPlan: InstallmentRecord = {
      id: `INS-${Date.now()}`,
      contractId: record.contractId,
      customerName: record.customerName,
      totalAmount,
      numberOfInstallments: installmentCount,
      installmentAmount: perInstallmentAmount,
      firstDueDate,
      paymentMethod: record.paymentMethod,
      notes: record.notes || `Auto-generated from contract renewal ${record.id}.`,
      schedules,
      createdAt: new Date().toISOString(),
      createdByRole: this.auth.currentRole(),
    };
    const existingInstallmentPlans = this.readStorageArray<InstallmentRecord>(INSTALLMENT_RECORDS_KEY);
    existingInstallmentPlans.unshift(installmentPlan);
    localStorage.setItem(INSTALLMENT_RECORDS_KEY, JSON.stringify(existingInstallmentPlans));
    this.installmentRecords.set(existingInstallmentPlans);

    this.contractRenewalMessage.set(
      `Existing contract renewal ${record.id} saved. Installment plan ${installmentPlan.id} and payment schedule auto-created.`,
    );
    this.contractRenewalForm.reset({
      contractId: '',
      customerName: '',
      contractStartDate: '',
      contractEndDate: '',
      renewalPeriodMonths: 12,
      renewalAmount: 5000,
      paymentMethod: 'Cash',
      installments: 1,
      notes: '',
    });
    this.contractAttachmentName.set('');
  }

  onContractAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.contractAttachmentName.set(file?.name ?? '');
  }

  submitPaymentMethod(): void {
    this.paymentMethodMessage.set(null);
    if (!this.isAdmin()) {
      this.paymentMethodMessage.set('Only admin can submit payment method details.');
      return;
    }
    if (this.paymentMethodForm.invalid) {
      this.paymentMethodForm.markAllAsTouched();
      return;
    }
    const record: PaymentMethodRecord = {
      id: `PAY-${Date.now()}`,
      ...this.paymentMethodForm.getRawValue(),
      createdAt: new Date().toISOString(),
      createdByRole: this.auth.currentRole(),
    };
    const existing = this.readStorageArray<PaymentMethodRecord>(PAYMENT_METHOD_RECORDS_KEY);
    existing.unshift(record);
    localStorage.setItem(PAYMENT_METHOD_RECORDS_KEY, JSON.stringify(existing));
    this.paymentMethodMessage.set(`Payment method ${record.id} saved.`);
    this.paymentMethodForm.reset({
      contractId: '',
      customerName: '',
      paymentMethod: 'Cash',
      paidAmount: 1000,
      paymentDate: '',
      transactionReference: '',
      notes: '',
    });
  }

  submitInstallments(): void {
    this.installmentMessage.set(null);
    if (!this.isAdmin()) {
      this.installmentMessage.set('Only admin can submit installments details.');
      return;
    }
    if (this.installmentForm.invalid) {
      this.installmentForm.markAllAsTouched();
      return;
    }
    const existing = this.readStorageArray<InstallmentRecord>(INSTALLMENT_RECORDS_KEY);
    const editingId = this.editingInstallmentId();

    if (editingId) {
      const index = existing.findIndex((item) => item.id === editingId);
      if (index === -1) {
        this.installmentMessage.set('Selected installment record was not found.');
        this.editingInstallmentId.set(null);
        return;
      }

      const updated: InstallmentRecord = {
        ...existing[index],
        ...this.installmentForm.getRawValue(),
        schedules: this.buildInstallmentSchedule(
          this.installmentForm.controls.firstDueDate.value,
          Number(this.installmentForm.controls.numberOfInstallments.value),
          Number(this.installmentForm.controls.installmentAmount.value),
        ),
      };
      existing[index] = updated;
      localStorage.setItem(INSTALLMENT_RECORDS_KEY, JSON.stringify(existing));
      this.installmentRecords.set(existing);
      this.installmentMessage.set(`Installment plan ${updated.id} updated.`);
    } else {
      const record: InstallmentRecord = {
        id: `INS-${Date.now()}`,
        ...this.installmentForm.getRawValue(),
        schedules: this.buildInstallmentSchedule(
          this.installmentForm.controls.firstDueDate.value,
          Number(this.installmentForm.controls.numberOfInstallments.value),
          Number(this.installmentForm.controls.installmentAmount.value),
        ),
        createdAt: new Date().toISOString(),
        createdByRole: this.auth.currentRole(),
      };
      existing.unshift(record);
      localStorage.setItem(INSTALLMENT_RECORDS_KEY, JSON.stringify(existing));
      this.installmentRecords.set(existing);
      this.installmentMessage.set(`Installment plan ${record.id} saved.`);
    }

    this.editingInstallmentId.set(null);
    this.activeMenu.set('installmentsView');
    this.resetInstallmentForm();
  }

  recalculateInstallmentAmount(): void {
    const totalAmount = Number(this.installmentForm.controls.totalAmount.value);
    const numberOfInstallments = Number(this.installmentForm.controls.numberOfInstallments.value);

    if (!Number.isFinite(totalAmount) || !Number.isFinite(numberOfInstallments) || numberOfInstallments <= 0) {
      return;
    }

    const installmentAmount = Number((totalAmount / numberOfInstallments).toFixed(2));
    this.installmentForm.controls.installmentAmount.setValue(installmentAmount, { emitEvent: false });
  }

  editInstallment(recordId: string): void {
    const record = this.installmentRecords().find((item) => item.id === recordId);
    if (!record) {
      this.installmentMessage.set('Installment record not found.');
      return;
    }

    this.editingInstallmentId.set(record.id);
    this.installmentForm.patchValue({
      contractId: record.contractId,
      customerName: record.customerName,
      totalAmount: record.totalAmount,
      numberOfInstallments: record.numberOfInstallments,
      installmentAmount: record.installmentAmount,
      firstDueDate: record.firstDueDate,
      paymentMethod: record.paymentMethod,
      notes: record.notes,
    });
    this.installmentMessage.set(`Editing ${record.id}. Update details and save.`);
    this.activeMenu.set('installmentsAdd');
  }

  deleteInstallment(recordId: string): void {
    const remaining = this.installmentRecords().filter((item) => item.id !== recordId);
    if (remaining.length === this.installmentRecords().length) {
      this.installmentMessage.set('Installment record not found.');
      return;
    }

    localStorage.setItem(INSTALLMENT_RECORDS_KEY, JSON.stringify(remaining));
    this.installmentRecords.set(remaining);

    if (this.editingInstallmentId() === recordId) {
      this.editingInstallmentId.set(null);
      this.resetInstallmentForm();
    }

    this.installmentMessage.set(`Installment plan ${recordId} deleted.`);
  }

  cancelInstallmentEdit(): void {
    this.editingInstallmentId.set(null);
    this.installmentMessage.set('Installment edit canceled.');
    this.resetInstallmentForm();
  }

  setInstallmentSearchTerm(value: string): void {
    this.installmentSearchTerm.set(value);
  }

  filteredInstallmentRecords(): InstallmentRecord[] {
    const query = this.installmentSearchTerm().trim().toLowerCase();
    if (!query) {
      return this.installmentRecords();
    }
    return this.installmentRecords().filter((item) => item.customerName.toLowerCase().includes(query));
  }

  startScheduleEdit(installmentId: string, installmentNo: number): void {
    const record = this.installmentRecords().find((item) => item.id === installmentId);
    const schedule = record?.schedules?.find((entry) => entry.installmentNo === installmentNo);
    if (!schedule) {
      this.installmentMessage.set('Payment schedule entry not found.');
      return;
    }
    this.editingScheduleKey.set(`${installmentId}-${installmentNo}`);
    this.scheduleDraftDueDate.set(schedule.dueDate);
    this.scheduleDraftAmount.set(schedule.amount);
    this.scheduleDraftStatus.set(schedule.status);
  }

  cancelScheduleEdit(): void {
    this.editingScheduleKey.set(null);
  }

  saveScheduleEdit(installmentId: string, installmentNo: number): void {
    const dueDate = this.scheduleDraftDueDate().trim();
    const amount = Number(this.scheduleDraftAmount());
    const status = this.scheduleDraftStatus();

    if (!dueDate || !Number.isFinite(amount) || amount <= 0) {
      this.installmentMessage.set('Please provide valid due date and amount for schedule.');
      return;
    }

    const updatedRecords = this.installmentRecords().map((item) => {
      if (item.id !== installmentId || !item.schedules?.length) {
        return item;
      }
      const updatedSchedules = item.schedules.map((entry) =>
        entry.installmentNo === installmentNo ? { ...entry, dueDate, amount, status } : entry,
      );
      return { ...item, schedules: updatedSchedules };
    });

    localStorage.setItem(INSTALLMENT_RECORDS_KEY, JSON.stringify(updatedRecords));
    this.installmentRecords.set(updatedRecords);
    this.editingScheduleKey.set(null);
    this.installmentMessage.set(`Payment schedule #${installmentNo} updated for ${installmentId}.`);
  }

  private resetInstallmentForm(): void {
    this.installmentForm.reset({
      contractId: '',
      customerName: '',
      totalAmount: 10000,
      numberOfInstallments: 3,
      installmentAmount: 3333,
      firstDueDate: '',
      paymentMethod: 'Cash',
      notes: '',
    });
    this.recalculateInstallmentAmount();
  }

  private buildInstallmentSchedule(
    firstDueDate: string,
    numberOfInstallments: number,
    installmentAmount: number,
  ): Array<{ installmentNo: number; dueDate: string; amount: number; status: 'Pending' | 'Paid' }> {
    const count = Math.max(1, Number(numberOfInstallments || 1));
    const amount = Number(Number(installmentAmount || 0).toFixed(2));
    return Array.from({ length: count }, (_, index) => ({
      installmentNo: index + 1,
      dueDate: this.addMonthsToDate(firstDueDate, index),
      amount,
      status: 'Pending',
    }));
  }

  private addMonthsToDate(dateInput: string, monthsToAdd: number): string {
    const baseDate = dateInput ? new Date(dateInput) : new Date();
    if (Number.isNaN(baseDate.getTime())) {
      return '';
    }
    const nextDate = new Date(baseDate);
    nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
    return nextDate.toISOString().split('T')[0] ?? '';
  }

  private loadSettings(): void {
    const raw = localStorage.getItem(SETTINGS_CONFIG_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<DashboardSettings>;
      this.settingsForm.patchValue({
        displayName: parsed.displayName ?? 'Sajjad Admin',
        email: parsed.email ?? 'admin@serviceforge.com',
        theme: parsed.theme ?? 'System',
        language: parsed.language ?? 'English',
        timezone: parsed.timezone ?? 'Asia/Dubai',
        autoLogoutMins: parsed.autoLogoutMins ?? 30,
        emailNotifications: parsed.emailNotifications ?? true,
        smsNotifications: parsed.smsNotifications ?? false,
        compactView: parsed.compactView ?? false,
      });
      if (parsed.updatedAt) {
        this.settingsLastUpdated.set(new Date(parsed.updatedAt).toLocaleString());
      }
      this.applyThemePreference(parsed.theme ?? 'System');
      this.applyCompactMode(parsed.compactView ?? false);
      this.displayName.set(parsed.displayName ?? 'Sajjad Admin');
    } catch {
      // Ignore malformed settings payload.
    }
  }

  private applyThemePreference(theme: string): void {
    const normalized = theme.toLowerCase();
    if (normalized === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.dataset['theme'] = prefersDark ? 'dark' : 'light';
      return;
    }
    document.body.dataset['theme'] = normalized;
  }

  private applyCompactMode(isCompact: boolean): void {
    document.body.dataset['density'] = isCompact ? 'compact' : 'comfortable';
  }

  private getInitialSidebarState(): boolean {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(max-width: 900px)').matches;
  }

  private readRequests(): MaintenanceRequest[] {
    return this.readStorageArray<MaintenanceRequest>(MAINTENANCE_REQUESTS_KEY);
  }

  private readStorageArray<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
}
