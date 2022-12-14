import fetchFilmGenres from './js/fetchFilmGenres';
import renderGallery from './js/renderGallery';
import { saveDataToStorage, fetchDataFromStorage } from './js/dataStorage';
import fetchFilmData from './js/fetchFilmData';
import showLoader from './js/loader';
// import { auth, signInWithEmailAndPassword, signOut } from './js/firebase__init';
import { onOpenModal, onCloseModal, onBackdropClick } from './js/main-modal';
import pagination from './js/pagination';
import { openModalDev } from './js/modalTeam';
// import watchedFilm from './js/addWatched';
// import queueFilm from './js/addqueueFilm';
import { innerLibraryList } from './js/library';
import MyModal from './js/mymodal';

// Посилання на елементи сторінки
const galleryEl = document.querySelector('.gallery');
const modalElement = document.querySelector('.js-backdrop');

// Додавання слухача на галерею
galleryEl.addEventListener('click', onCardClick);

function onCardClick(event) {
	if (event.target.dataset.action === 'open-modal') {
		onOpenModal(event.target.parentNode.dataset.id, modalElement);
	}
}

const path = window.location.pathname;

switch (path.slice(path.lastIndexOf('/'))) {
	case '/library.html':
		populateLibraryHtml();
		break;
		
		default:
			populateIndexHtml();
			
			// Вішаєм слухача на searchForm
			document.querySelector('.search-bar')?.addEventListener('submit', onSearch);
			
			break;
}
		
		pagination.on('afterMove', function (eventData) {
			const searchQuery = fetchDataFromStorage('searchQuery')?.query || '';
			if (searchQuery) {
				searchIndexHTML({ page: eventData.page, query: searchQuery });
			} else {
				populateIndexHtml(eventData.page);
			}
			window.scrollTo(top);
		});
	
function populateIndexHtml(page = 1) {
	// console.log('showing loader first');
	showLoader(true);

	localStorage.removeItem('searchQuery');

	Promise.all([fetchFilmGenres(), fetchFilmData({ page })])
		.then(([genres, { page: currentPage, results, total_results }]) => {
			
			if (!fetchDataFromStorage('genres'))
			{ saveDataToStorage('genres', genres); }
			
			saveDataToStorage('requestResults', results);

			if (currentPage === 1) {
			pagination.reset(total_results);}

			renderGallery({
				data: results,
				elementRef: galleryEl,
			});
		})
		.catch(err => {
			window.alert('There was an error during last server request');
			console.error(err);
		})
		.finally(() => {
			// console.log('hiding loader finally');
			showLoader(false);
		});
}

function populateLibraryHtml() {
	// console.log('hiding loader on library');
	showLoader(true);
	localStorage.removeItem('searchQuery');

	document.getElementById('btn-lib').addEventListener('click', innerLibraryList);

	innerLibraryList();
	pagination.setTotalItems(10);
	showLoader(false);
}

function onSearch(e) {
	e.preventDefault();

	const request = e.target.search.value.trim().toLowerCase();
	e.target.search.value = request;

	if (request) searchIndexHTML({ page: 1, query: `${request}` }).catch(console.error);
}

function searchIndexHTML({ page, query }) {
	showLoader(true);

	return fetchFilmData({ page, query, isSearch: 'true' }).then(({ page: currentPage, results, total_results }) => {
		if (!results.length) {
			showFailedNotification();
			showLoader(false);

			return Promise.reject('nothing found');
		} else {
			saveDataToStorage('searchQuery', { query });
			saveDataToStorage('requestResults', results);

			if (currentPage === 1) {
			pagination.reset(total_results);}

			renderGallery({
				data: results,
				elementRef: galleryEl,
			});

			addSearchDescription({ searchQuery: query, elementRef: galleryEl });

			showLoader(false);
		}
	});
}

function showFailedNotification() {
	const message = document.querySelector('.input-error');

	message.classList.remove('hide');
	setTimeout(() => message.classList.add('hide'), 4000);

	document.getElementById('textInput').value = '';
}

export function addSearchDescription({ searchQuery, elementRef }) {
	elementRef.insertAdjacentHTML(
		'afterbegin',
		`<div class="search-query"> Search results for the query: '${searchQuery}'<div>
          <button type="button" class="btn-populateFilm">Back to Popular Films</button>`
	);
	const btnPopulateFilm = document.querySelector('.btn-populateFilm');
	btnPopulateFilm?.addEventListener('click', () => {
		showLoader(true);

		populateIndexHtml(1);
		document.getElementById('textInput').value = '';
		localStorage.removeItem('searchQuery');
	});
}

//get modal-dev reference
const modalDevRef = document.getElementById('modal-dev');

// if modal-dev exists, initialize MyModal class
if (modalDevRef) {
	const modalDev = new MyModal({
		modalRef: modalDevRef,
	});

	// add listener to open modal-dev window
	document.querySelector('[data-open-modal-dev]').addEventListener('click', e => {
		openModalDev(e, modalDev);
	});
}