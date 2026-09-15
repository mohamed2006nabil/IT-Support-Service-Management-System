import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentNotifications } from './agent-notifications';

describe('AgentNotifications', () => {
  let component: AgentNotifications;
  let fixture: ComponentFixture<AgentNotifications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentNotifications],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentNotifications);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
