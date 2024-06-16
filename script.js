// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    fetchMovies();
});

function fetchMovies() {
    fetch('http://localhost:3000/api/movies')
        .then(response => response.json())
        .then(movies => {
            const moviesList = document.getElementById('movies-list');
            moviesList.innerHTML = '';

            movies.forEach(movie => {
                const movieDiv = document.createElement('div');
                movieDiv.classList.add('movie');
                movieDiv.innerHTML = `
                    <h3>${movie.title}</h3>
                    <p><strong>Genre:</strong> ${movie.genre}</p>
                    <p><strong>Showtimes:</strong> ${movie.showtimes}</p>
                `;
                moviesList.appendChild(movieDiv);
            });
        })
        .catch(error => console.error('Error fetching movies:', error));
}
