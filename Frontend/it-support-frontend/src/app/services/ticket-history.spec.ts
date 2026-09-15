import { TestBed } from '@angular/core/testing';
import { TicketHistory } from './ticket-history';

describe('TicketHistory', () => {
  let service: TicketHistory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketHistory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
