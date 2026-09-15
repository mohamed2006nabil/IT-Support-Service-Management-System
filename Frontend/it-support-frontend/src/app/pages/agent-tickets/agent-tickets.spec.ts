import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentTickets } from './agent-tickets';

describe('AgentTickets', () => {
  let component: AgentTickets;
  let fixture: ComponentFixture<AgentTickets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentTickets],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentTickets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
