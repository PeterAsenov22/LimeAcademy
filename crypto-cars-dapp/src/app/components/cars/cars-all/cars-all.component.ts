import { Component, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-cars-all',
  templateUrl: './cars-all.component.html',
  styleUrls: ['./cars-all.component.css']
})
export class CarsAllComponent implements OnInit {
  protected filteredCars;
  protected filterForm;
  protected filters = ['All', 'New', 'Second-Hand'];
  private allCars;

  constructor(
    private contractService: ContractService,
    private fb: FormBuilder) { }

  ngOnInit() {
    this.filterForm = this.fb.group({
      filterControl: ['All']
    });

    this.onFilterChange();

    this.contractService
      .getAllCars()
      .subscribe(result => {
        this.allCars = result;
        this.filterCars(this.filter.value);
      });
  }

  get filter() {
    return this.filterForm.get('filterControl');
  }

  onFilterChange() {
    this.filter.valueChanges.subscribe(filter => {
      this.filterCars(filter);
    });
  }

  filterCars(filter: string) {
    switch (filter) {
      case 'All':
        this.filteredCars = this.allCars;
        break;
      case 'New':
        this.filteredCars = this.allCars.filter(c => c._isSecondHand === false);
        break;
      case 'Second-Hand':
        this.filteredCars = this.allCars.filter(c => c._isSecondHand === true);
    }
  }
}
