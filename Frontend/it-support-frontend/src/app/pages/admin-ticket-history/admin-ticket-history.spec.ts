import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTicketHistory } from './admin-ticket-history';

describe('AdminTicketHistory', () => {
  let component: AdminTicketHistory;
  let fixture: ComponentFixture<AdminTicketHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTicketHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTicketHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
