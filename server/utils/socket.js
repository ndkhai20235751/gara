let _io = null;

const setIO = (io) => { _io = io; };

const emit = (event, data) => {
  if (_io) _io.emit(event, data);
};

module.exports = { setIO, emit };
