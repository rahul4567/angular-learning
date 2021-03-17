import { Component, ViewChild, ElementRef, OnInit } from "@angular/core";
import { of } from "rxjs";
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter
} from "rxjs/operators";
import { fromEvent } from 'rxjs';
import { HttpClient, HttpParams } from "@angular/common/http";

const APIKEY = "e8067b53";
const DISCOVERY_API_KEY = "XODPes1EgyaARKXv4oJ9JA7yiFeUyMCV";

const PARAMS = new HttpParams({
  fromObject: {
    action: "opensearch",
    format: "json",
    origin: "*"
  }
});

@Component({
  selector: 'app-search-component',
  templateUrl: './search-component.component.html',
  styleUrls: ['./search-component.component.less']
})
export class SearchComponentComponent implements OnInit {

  @ViewChild('discoverySearchInput') discoverySearchInput: ElementRef;
  apiResponse: any;
  isSearching: boolean;
  cacheResult: any;
  noResultFlag : boolean;
  searchText : string;

  constructor(
    private httpClient: HttpClient
  ) {
    this.isSearching = false;
    this.apiResponse = {
      _embedded : {
        events : []
      }
    };
    this.cacheResult = {};
    this.searchText = '';
    this.noResultFlag = false;

    console.log(this.discoverySearchInput);
  }

  ngOnInit() {

    console.log(this.discoverySearchInput);



    fromEvent(this.discoverySearchInput.nativeElement, 'keyup').pipe(

      // get value
      map((event: any) => {
        return event.target.value;
      })
      // if character length greater then 2
      , filter(res => res.length > 2)

      // Time in milliseconds between key events
      , debounceTime(1000)

      // If previous query is diffent from current
      , distinctUntilChanged()

      // subscription for response
    ).subscribe((text: string) => {
      this.isSearching = true;
      this.searchText = text;
      if (this.cacheResult[text]) {
        this.apiResponse = this.cacheResult[text];
        this.noResultFlag = this.apiResponse._embedded.events.length === 0;
        this.isSearching = false;
      } else {
        this.searchGetCall(text).subscribe((res : any) => {
          console.log('res', res);
          this.isSearching = false;
          if (res.page.totalElements) {
            this.apiResponse = res;
            this.noResultFlag = false;
          } else {
            this.apiResponse = {
              _embedded : {
                events : []
              }
            };
            this.noResultFlag = true;
          }
          this.cacheResult[text] = this.apiResponse;
          this.removedCachedValue();
        }, (err) => {
          this.isSearching = false;
          console.log('error', err);
        });
      }
    });
  }

  removedCachedValue() {
    let keysCount = Object.keys(this.cacheResult);
    if (keysCount.length > 5) {
      delete this.cacheResult[keysCount[0]];
    }
  }

  searchGetCall(term: string) {
    let getRequestCall = `https://app.ticketmaster.com/discovery/v2/events.json?keyword=${term}&source=universe&countryCode=US&apikey=${DISCOVERY_API_KEY}`;
    if (term === '') {
      return of([]);
    }
    return this.httpClient.get(getRequestCall);
  }
}
