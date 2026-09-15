import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentTicketHistory } from './agent-ticket-history';

describe('AgentTicketHistory', () => {
  let component: AgentTicketHistory;
  let fixture: ComponentFixture<AgentTicketHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentTicketHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentTicketHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
