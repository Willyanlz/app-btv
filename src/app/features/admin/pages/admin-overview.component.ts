import { Component } from '@angular/core';import { MockDataService } from '../../../core/services/mock-data.service';@Component({selector:'app-admin-overview',templateUrl: './admin-overview.component.html',styleUrls: ['./admin-overview.component.scss']})
export class AdminOverviewComponent{constructor(public data:MockDataService){}}
