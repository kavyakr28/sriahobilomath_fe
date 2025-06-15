import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualEntryComponent } from './manual-entry.component';

describe('ManualEntryComponent', () => {
  let component: ManualEntryComponent;
  let fixture: ComponentFixture<ManualEntryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ManualEntryComponent]
    });
    fixture = TestBed.createComponent(ManualEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
