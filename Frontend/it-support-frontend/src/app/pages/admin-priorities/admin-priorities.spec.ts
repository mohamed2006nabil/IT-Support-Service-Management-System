import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPriorities } from './admin-priorities';

describe('AdminPriorities', () => {
  let component: AdminPriorities;
  let fixture: ComponentFixture<AdminPriorities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPriorities],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPriorities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
