import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentTicketDetails } from './agent-ticket-details';

describe('AgentTicketDetails', () => {
  let component: AgentTicketDetails;
  let fixture: ComponentFixture<AgentTicketDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentTicketDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentTicketDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
