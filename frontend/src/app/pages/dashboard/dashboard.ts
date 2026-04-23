import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

const SIDEBAR_STATE_KEY = 'serviceforge_sidebar_collapsed';
const MAINTENANCE_REQUESTS_KEY = 'serviceforge_maintenance_requests';
const SLA_CONFIG_KEY = 'serviceforge_sla_config';
const ENQUIRY_RECORDS_KEY = 'serviceforge_enquiry_records';
const ORDER_LEAD_RECORDS_KEY = 'serviceforge_order_lead_records';

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

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isSidebarCollapsed = signal(this.getInitialSidebarState());
  readonly activeMenu = signal<'maintenance' | 'overview' | 'sla' | 'enquiry' | 'orderLeads'>('overview');
  readonly requestMessage = signal<string | null>(null);
  readonly slaMessage = signal<string | null>(null);
  readonly slaAttachmentName = signal<string>('');
  readonly enquiryMessage = signal<string | null>(null);
  readonly orderLeadMessage = signal<string | null>(null);
  readonly serviceKinds = [
    'AC Maintainance',
    'Electrical',
    'Mechanical',
    'Floor Maitaince',
    'Painting',
    'Annual Maintaince',
  ] as const;
  readonly priorityLevels = ['High', 'Medium', 'Urgent'] as const;
  readonly enquiryTypes = ['General', 'Service', 'Complaint', 'Feedback'] as const;
  readonly contactModes = ['Email', 'Phone', 'WhatsApp'] as const;
  readonly leadSources = ['Website', 'Referral', 'Sales Call', 'Walk-In'] as const;

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

  constructor() {
    const saved = localStorage.getItem(SLA_CONFIG_KEY);
    if (!saved) {
      return;
    }
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

  selectMenu(menu: 'maintenance' | 'overview' | 'sla' | 'enquiry' | 'orderLeads'): void {
    this.activeMenu.set(menu);
    if (window.matchMedia('(max-width: 900px)').matches) {
      this.closeSidebar();
    }
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
    if (!this.isCustomer()) {
      this.enquiryMessage.set('Only customer can submit enquiry.');
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
    if (!this.isCustomer()) {
      this.orderLeadMessage.set('Only customer can submit order leads.');
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
